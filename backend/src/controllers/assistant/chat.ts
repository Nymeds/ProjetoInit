import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { env } from '../../env/index.js';
import { prisma } from '../../utils/prismaClient.js';
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js';
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js';
import { PrismaUsersRepository } from '../../repositories/prisma/prisma-users-repository.js';
import { PrismaMessagesRepository } from '../../repositories/prisma/prisma-messages-repository.js';
import { CreateTodoUseCase } from '../../use-cases/todo/create-todo.js';
import { SelectTodosUseCase } from '../../use-cases/todo/select-todo.js';
import { CompleteTodoUseCase } from '../../use-cases/todo/complete-todo.js';
import { UpdateTodoUseCase } from '../../use-cases/todo/update-todo.js';
import { CreateGroupUseCase } from '../../use-cases/groups/create.js';
import { ListGroupsUseCase } from '../../use-cases/groups/list-groups.js';
import { ListGroupMessagesUseCase } from '../../use-cases/messages/list-by-group.js';
import { CreateGroupMessageUseCase } from '../../use-cases/messages/create-for-group.js';

const SYSTEM_INSTRUCTION = `
Voce e a ELISA.
Objetivo: ajudar em tarefas e grupos.
Regras:
- Responda em pt-BR.
- Use ferramentas quando houver acao de sistema.
- Se faltarem dados, pergunte curto e objetivo.
- Se houver varias acoes, execute em ordem.
- No grupo, aja de forma objetiva e curta.
- Se for apenas cumprimento, apenas cumprimente.
`;

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_CONTEXT_MESSAGES = 12;
const MAX_GROUP_CONTEXT_MESSAGES = 8;
const MAX_TOOL_ROUNDS = 5;
const MAX_TEXT_PER_MESSAGE = 320;
const MAX_THREAD_CONTEXT_CHARS = 2400;
const MAX_GROUP_CONTEXT_CHARS = 1400;
const GROUP_SUMMARY_EVERY_MESSAGES = 10;
const GROUP_SUMMARY_PREFIX = 'GROUP_SUMMARY';
const ELISA_STATE_PREFIX = 'ELISA_STATE';
const PROACTIVE_TASK_COOLDOWN_MS = 2 * 60 * 1000;
const PENDING_CONFIRMATION_TTL_MS = 5 * 60 * 1000;
const PENDING_FOLLOW_UP_TTL_MS = 8 * 60 * 1000;
const GREETING_PATTERN = /^(oi|ola|ol[áa]|bom dia|boa tarde|boa noite|e ai|iae|salve|hey)\b[!. ]*$/i;
const YES_PATTERN = /^(sim|s|pode|ok|claro|manda|pode sim|confirmo)\b/i;
const NO_PATTERN = /^(nao|não|n|deixa|deixa pra la|deixa pra lá|agora nao|agora não)\b/i;
const INTERNAL_GROUP_ORCHESTRATION_PREFIXES = [
  'O usuario confirmou a execucao de uma tarefa no grupo.',
  'Continuacao de conversa no grupo.',
];

const ai = new GoogleGenAI({ apiKey: env.IAAPIKEY });
const proactiveTaskPromptCooldown = new Map<string, number>();
const todosRepository = new PrismaTodosRepository();
const groupsRepository = new PrismaGroupsRepository();
const usersRepository = new PrismaUsersRepository();
const messagesRepository = new PrismaMessagesRepository();
const createTodoUseCase = new CreateTodoUseCase(todosRepository);
const selectTodosUseCase = new SelectTodosUseCase(todosRepository);
const completeTodoUseCase = new CompleteTodoUseCase(todosRepository);
const updateTodoUseCase = new UpdateTodoUseCase(todosRepository);
const createGroupUseCase = new CreateGroupUseCase(groupsRepository, usersRepository);
const listGroupsUseCase = new ListGroupsUseCase(groupsRepository);
const listGroupMessagesUseCase = new ListGroupMessagesUseCase(messagesRepository);
const createGroupMessageUseCase = new CreateGroupMessageUseCase(messagesRepository);

const chatBodySchema = z.object({
  message: z.string().min(1, 'Mensagem obrigatoria'),
  groupId: z.string().min(1).optional(),
  autoPostToGroup: z.boolean().optional(),
});

const createTaskArgsSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  groupName: z.string().optional(),
});

const createGroupArgsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userEmails: z.array(z.string().email()).min(2),
});

const searchTasksArgsSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

const markTaskDoneArgsSchema = z.object({
  title: z.string().min(1),
  groupName: z.string().optional(),
});

const listGroupMembersArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
});

const listGroupHistoryArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

const postGroupNoticeArgsSchema = z.object({
  content: z.string().min(1),
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
});

const moveTaskArgsSchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  fromGroupName: z.string().optional(),
  groupNameDestination: z.string().optional(),
  moveToNoGroup: z.boolean().optional(),
}).superRefine((args, ctx) => {
  if (!args.taskId && !args.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe taskId ou title para identificar a tarefa.',
    });
  }

  if (!args.moveToNoGroup && !args.groupNameDestination) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe groupNameDestination ou moveToNoGroup=true.',
    });
  }
});

type AssistantAction =
  | { type: 'task_created'; id: number }
  | { type: 'group_created'; id: string }
  | { type: 'task_completed'; id: number }
  | { type: 'task_moved'; id: number; groupId: string | null }
  | { type: 'group_message_sent'; id: string; groupId: string };

type ToolResult = {
  ok: boolean;
  error?: string;
  errorId?: string;
  candidates?: Array<{ id: number; title: string; group: string | null }>;
  [key: string]: unknown;
};

type ToolFailure = {
  tool: string;
  args: unknown;
  result: ToolResult;
};

interface AssistantRuntimeContext {
  sourceGroupId?: string;
}

interface AssistantProcessParams {
  userId: string;
  message: string;
  sourceGroupId?: string;
  autoPostToSourceGroup?: boolean;
  skipThreadHistory?: boolean;
  persistInAssistantHistory?: boolean;
  io?: any;
}

class ToolExecutionFailed extends Error {
  failure: ToolFailure;

  constructor(failure: ToolFailure) {
    super(failure.result.error || 'Falha ao executar ferramenta.');
    this.name = 'ToolExecutionFailed';
    this.failure = failure;
  }
}

function toSafeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function extractErrorDetails(err: unknown) {
  if (err instanceof z.ZodError) {
    return {
      type: 'ZodError',
      message: err.message,
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    type: 'UnknownError',
    value: toSafeJson(err),
  };
}

function buildErrorId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function buildRetryQuestion(failure: ToolFailure): string {
  const errorText = failure.result.error || 'Nao consegui concluir essa acao.';

  if (Array.isArray(failure.result.candidates) && failure.result.candidates.length > 0) {
    const options = failure.result.candidates
      .slice(0, 5)
      .map((candidate) => `${candidate.id} (${candidate.title})`)
      .join(', ');

    return `${errorText} Me informe o taskId correto para eu tentar novamente. Opcoes encontradas: ${options}.`;
  }

  if (errorText.includes('Grupo nao encontrado')) {
    return `${errorText} Qual o nome exato do grupo?`;
  }

  if (errorText.includes('Tarefa nao encontrada')) {
    return `${errorText} Pode me informar o taskId da tarefa ou o titulo exato?`;
  }

  if (errorText.includes('Ja existe um grupo com esse nome')) {
    return `${errorText} Me passe outro nome para o grupo.`;
  }

  return `${errorText} Pode me passar os dados que faltam para eu tentar novamente?`;
}

function extractTextFromResponse(response: any): string | undefined {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  const text = parts
    .filter((part: any) => typeof part?.text === 'string')
    .map((part: any) => part.text)
    .join('');

  return text || undefined;
}

async function getOrCreateThread(userId: string) {
  return prisma.assistantThread.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function toModelRole(role: string) {
  return role === 'USER' ? 'user' : 'model';
}

function isInternalOrchestrationContent(content: string) {
  return INTERNAL_GROUP_ORCHESTRATION_PREFIXES.some((prefix) => content.startsWith(prefix));
}

function sanitizeMentionPrompt(message: string) {
  return message.replace(/\belisa\b[:,\-]?\s*/i, '').trim() || message.trim();
}

function isGreetingOnlyToElisa(message: string) {
  return GREETING_PATTERN.test(sanitizeMentionPrompt(message));
}

function createGreetingReply() {
  return 'ELISA: Oi! Estou por aqui. Se quiser, me diga o que voce precisa.';
}

function normalizeElisaContent(content: string) {
  const trimmed = content.trim();
  return /^elisa:/i.test(trimmed) ? trimmed : `ELISA: ${trimmed}`;
}

function looksLikeTaskIntent(message: string) {
  const text = message.toLowerCase().trim();
  if (text.length < 10) return false;
  if (/\belisa\b/i.test(text)) return false;

  const patterns = [
    /\bpreciso\b.*\b(fazer|criar|lembrar|resolver|entregar|organizar|marcar)\b/,
    /\btemos que\b/,
    /\bnao esquecer\b/,
    /\blembrar de\b/,
    /\bcriar\b.*\btarefa\b/,
    /\bfalta\b.*\b(fazer|entregar|finalizar)\b/,
    /\bdepois\b.*\b(fazer|ver|ajustar)\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function buildProactiveTaskPrompt(targetName?: string) {
  const mention = targetName ? `${targetName}, ` : '';
  return `ELISA: ${mention}parece que voce descreveu uma tarefa. Quer que eu execute isso agora e avise o grupo?`;
}

function buildFailureReply(reason: string) {
  return `ELISA: Nao consegui concluir agora. Motivo: ${reason}`;
}

function isPositiveConfirmation(message: string) {
  return YES_PATTERN.test(message.trim().toLowerCase());
}

function isNegativeConfirmation(message: string) {
  return NO_PATTERN.test(message.trim().toLowerCase());
}

function shouldKeepFollowUp(content: string) {
  const text = content.trim().toLowerCase();
  if (!text) return false;
  return text.endsWith('?')
    || text.includes('qual ')
    || text.includes('pode me informar')
    || text.includes('me passe')
    || text.includes('informe');
}

function buildSummaryContent(groupId: string, groupName: string, summary: string) {
  return `${GROUP_SUMMARY_PREFIX}|${groupId}|${new Date().toISOString()}|${groupName}|${summary}`;
}

function encodeStatePart(value: string) {
  return encodeURIComponent(value);
}

function decodeStatePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pendingConfirmPrefix(groupId: string) {
  return `${ELISA_STATE_PREFIX}|PENDING_CONFIRM|${groupId}|`;
}

function followUpPrefix(groupId: string) {
  return `${ELISA_STATE_PREFIX}|FOLLOW_UP|${groupId}|`;
}

function buildPendingConfirmStateContent(groupId: string, createdAtMs: number, originalContent: string) {
  return `${ELISA_STATE_PREFIX}|PENDING_CONFIRM|${groupId}|${createdAtMs}|${encodeStatePart(originalContent)}`;
}

function parsePendingConfirmStateContent(content: string) {
  const parts = content.split('|');
  if (parts.length < 5 || parts[0] !== ELISA_STATE_PREFIX || parts[1] !== 'PENDING_CONFIRM') {
    return null;
  }

  const createdAtMs = Number(parts[3]);
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    groupId: parts[2],
    createdAtMs,
    originalContent: decodeStatePart(parts.slice(4).join('|')),
  };
}

function buildFollowUpStateContent(groupId: string, createdAtMs: number, turnsLeft: number, lastPrompt: string) {
  return `${ELISA_STATE_PREFIX}|FOLLOW_UP|${groupId}|${createdAtMs}|${turnsLeft}|${encodeStatePart(lastPrompt)}`;
}

function parseFollowUpStateContent(content: string) {
  const parts = content.split('|');
  if (parts.length < 6 || parts[0] !== ELISA_STATE_PREFIX || parts[1] !== 'FOLLOW_UP') {
    return null;
  }

  const createdAtMs = Number(parts[3]);
  const turnsLeft = Number(parts[4]);
  if (!Number.isFinite(createdAtMs) || !Number.isFinite(turnsLeft)) return null;

  return {
    groupId: parts[2],
    createdAtMs,
    turnsLeft,
    lastPrompt: decodeStatePart(parts.slice(5).join('|')),
  };
}

async function setPendingTaskConfirmationState(userId: string, groupId: string, originalContent: string) {
  const thread = await getOrCreateThread(userId);
  await prisma.assistantMessage.deleteMany({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: pendingConfirmPrefix(groupId) },
    },
  });

  await prisma.assistantMessage.create({
    data: {
      threadId: thread.id,
      role: 'TOOL',
      content: buildPendingConfirmStateContent(groupId, Date.now(), originalContent.trim()),
    },
  });
}

async function getPendingTaskConfirmationState(userId: string, groupId: string) {
  const thread = await prisma.assistantThread.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!thread) return null;

  const stateMessage = await prisma.assistantMessage.findFirst({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: pendingConfirmPrefix(groupId) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!stateMessage) return null;

  return parsePendingConfirmStateContent(stateMessage.content);
}

async function clearPendingTaskConfirmationState(userId: string, groupId: string) {
  const thread = await prisma.assistantThread.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!thread) return;

  await prisma.assistantMessage.deleteMany({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: pendingConfirmPrefix(groupId) },
    },
  });
}

async function setFollowUpState(userId: string, groupId: string, lastPrompt: string, turnsLeft = 3) {
  const thread = await getOrCreateThread(userId);
  await prisma.assistantMessage.deleteMany({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: followUpPrefix(groupId) },
    },
  });

  if (!shouldKeepFollowUp(lastPrompt)) return;

  await prisma.assistantMessage.create({
    data: {
      threadId: thread.id,
      role: 'TOOL',
      content: buildFollowUpStateContent(groupId, Date.now(), turnsLeft, lastPrompt),
    },
  });
}

async function getFollowUpState(userId: string, groupId: string) {
  const thread = await prisma.assistantThread.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!thread) return null;

  const stateMessage = await prisma.assistantMessage.findFirst({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: followUpPrefix(groupId) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!stateMessage) return null;

  return parseFollowUpStateContent(stateMessage.content);
}

async function clearFollowUpState(userId: string, groupId: string) {
  const thread = await prisma.assistantThread.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!thread) return;

  await prisma.assistantMessage.deleteMany({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { startsWith: followUpPrefix(groupId) },
    },
  });
}

async function registerAssistantFollowUp(groupId: string, userId: string, assistantContent: string) {
  await setFollowUpState(userId, groupId, assistantContent, 3);
}

function buildGroupSummaryFromMessages(
  groupName: string,
  messages: Array<{ authorName: string; content: string }>,
) {
  const compactLines = messages
    .slice(-10)
    .map((m) => `${m.authorName}: ${compactText(m.content, 120)}`);

  const taskRelated = compactLines.filter((line) =>
    /\btarefa|entregar|prazo|fazer|resolver|ajustar|finalizar|concluir\b/i.test(line),
  );

  const highlights = taskRelated.length > 0
    ? taskRelated.slice(-3).join(' | ')
    : compactLines.slice(-3).join(' | ');

  return `Resumo do grupo ${groupName}. Topicos recentes: ${highlights}`;
}

function compactText(value: string, maxChars = MAX_TEXT_PER_MESSAGE) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}...`;
}

function buildThreadContents(
  history: Array<{ role: string; content: string }>,
  budgetChars = MAX_THREAD_CONTEXT_CHARS,
) {
  const selected: Array<{ role: string; content: string }> = [];
  let used = 0;

  for (const item of history.slice().reverse()) {
    const compact = compactText(item.content);
    const cost = compact.length;
    if (selected.length > 0 && used + cost > budgetChars) break;
    selected.push({ role: item.role, content: compact });
    used += cost;
  }

  return selected
    .reverse()
    .map((m) => ({ role: toModelRole(m.role), parts: [{ text: m.content }] }));
}

function buildGroupHistoryPrompt(
  groupName: string,
  messages: Array<{ authorName: string; content: string; createdAt: Date }>,
) {
  let used = 0;
  const lines: string[] = [];

  for (const message of messages.slice().reverse()) {
    const line = `${message.authorName}: ${compactText(message.content, 180)}`;
    if (lines.length > 0 && used + line.length > MAX_GROUP_CONTEXT_CHARS) break;
    lines.push(line);
    used += line.length;
  }

  const historyText = lines.length === 0 ? 'Sem mensagens recentes.' : lines.reverse().join('\n');

  return `Contexto recente do grupo "${groupName}":\n${historyText}`;
}

async function getRecentGroupSummaryMemory(userId: string, groupId: string, take = 4) {
  const thread = await prisma.assistantThread.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!thread) return [];

  const summaries = await prisma.assistantMessage.findMany({
    where: {
      threadId: thread.id,
      role: 'TOOL',
      content: { contains: `${GROUP_SUMMARY_PREFIX}|${groupId}|` },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return summaries
    .slice()
    .reverse()
    .map((s) => compactText(s.content, 220));
}

export async function sendElisaMessageToGroup(params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
  registerFollowUp?: boolean;
}) {
  const created = await prisma.message.create({
    data: {
      groupId: params.groupId,
      authorId: params.userId,
      content: normalizeElisaContent(params.content),
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  });

  const payload = {
    id: created.id,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    kind: created.kind,
    authorId: created.authorId,
    authorName: created.author?.name ?? null,
    groupId: created.groupId,
    todoId: created.todoId,
  };

  if (params.io) {
    params.io.to(`group:${params.groupId}`).emit('group:message', payload);
  }

  if (params.registerFollowUp !== false) {
    await registerAssistantFollowUp(params.groupId, params.userId, payload.content);
  }

  return payload;
}

export async function maybeStoreGroupSummaryMemory(params: {
  groupId: string;
}) {
  const totalMessages = await prisma.message.count({ where: { groupId: params.groupId } });
  if (totalMessages === 0 || totalMessages % GROUP_SUMMARY_EVERY_MESSAGES !== 0) {
    return;
  }

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });
  if (!group) return;

  const recentMessages = await prisma.message.findMany({
    where: { groupId: params.groupId },
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: GROUP_SUMMARY_EVERY_MESSAGES,
  });
  if (recentMessages.length === 0) return;

  const summary = buildGroupSummaryFromMessages(
    group.name,
    recentMessages
      .slice()
      .reverse()
      .map((m) => ({
        authorName: m.author?.name ?? 'Sem nome',
        content: m.content,
      })),
  );

  const summaryContent = buildSummaryContent(group.id, group.name, compactText(summary, 500));

  await prisma.$transaction(async (tx) => {
    for (const member of group.members) {
      const thread = await tx.assistantThread.upsert({
        where: { userId: member.userId },
        update: {},
        create: { userId: member.userId },
      });

      await tx.assistantMessage.create({
        data: {
          threadId: thread.id,
          role: 'TOOL',
          content: summaryContent,
        },
      });
    }
  });
}

export async function maybePromptTaskActionInGroup(params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  if (!looksLikeTaskIntent(params.content)) return;

  const cooldownKey = `${params.groupId}:${params.userId}`;
  const lastSentAt = proactiveTaskPromptCooldown.get(cooldownKey) ?? 0;
  if (Date.now() - lastSentAt < PROACTIVE_TASK_COOLDOWN_MS) return;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true },
  });

  await setPendingTaskConfirmationState(params.userId, params.groupId, params.content);

  const prompt = buildProactiveTaskPrompt(user?.name ?? undefined);
  await sendElisaMessageToGroup({
    groupId: params.groupId,
    userId: params.userId,
    content: prompt,
    io: params.io,
  });

  proactiveTaskPromptCooldown.set(cooldownKey, Date.now());
}

export async function maybeHandleTaskConfirmationInGroup(params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  const pending = await getPendingTaskConfirmationState(params.userId, params.groupId);
  if (!pending) return false;

  if (Date.now() - pending.createdAtMs > PENDING_CONFIRMATION_TTL_MS) {
    await clearPendingTaskConfirmationState(params.userId, params.groupId);
    return false;
  }

  const normalized = params.content.trim();
  if (isNegativeConfirmation(normalized)) {
    await clearPendingTaskConfirmationState(params.userId, params.groupId);
    await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: 'ELISA: Perfeito, nao vou executar essa acao agora.',
      io: params.io,
    });
    return true;
  }

  if (!isPositiveConfirmation(normalized)) {
    return false;
  }

  await clearPendingTaskConfirmationState(params.userId, params.groupId);

  try {
    await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: 'ELISA: Entendi. Vou executar agora e te aviso o resultado.',
      io: params.io,
      registerFollowUp: false,
    });

    const result = await processAssistantMessage({
      userId: params.userId,
      sourceGroupId: params.groupId,
      autoPostToSourceGroup: true,
      skipThreadHistory: true,
      persistInAssistantHistory: false,
      io: params.io,
      message: `O usuario confirmou a execucao de uma tarefa no grupo. Solicitação original: "${pending.originalContent}". Execute o que for possivel agora e avise o resultado no grupo.`,
    });

    if (result.toolFailures.length > 0 && !result.postedGroupMessage) {
      await sendElisaMessageToGroup({
        groupId: params.groupId,
        userId: params.userId,
        content: buildFailureReply(result.toolFailures[0]?.error ?? 'falha ao executar ferramenta'),
        io: params.io,
      });
    }
  } catch (err: any) {
    await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: buildFailureReply(err?.message || 'erro inesperado'),
      io: params.io,
    });
  }

  return true;
}

export async function maybeHandleAssistantFollowUpInGroup(params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  const pending = await getFollowUpState(params.userId, params.groupId);
  if (!pending) return false;

  if (Date.now() - pending.createdAtMs > PENDING_FOLLOW_UP_TTL_MS || pending.turnsLeft <= 0) {
    await clearFollowUpState(params.userId, params.groupId);
    return false;
  }

  const userInput = params.content.trim();
  if (!userInput) return false;
  if (/\belisa\b/i.test(userInput)) return false;

  await setFollowUpState(
    params.userId,
    params.groupId,
    pending.lastPrompt,
    pending.turnsLeft - 1,
  );

  try {
    await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: 'ELISA: Recebi. Estou processando sua resposta.',
      io: params.io,
      registerFollowUp: false,
    });

    const result = await processAssistantMessage({
      userId: params.userId,
      sourceGroupId: params.groupId,
      autoPostToSourceGroup: true,
      skipThreadHistory: true,
      persistInAssistantHistory: false,
      io: params.io,
      message: `Continuacao de conversa no grupo. Ultima pergunta da ELISA: "${compactText(pending.lastPrompt, 180)}". Resposta do usuario: "${compactText(userInput, 180)}". Continue a execucao e responda no grupo.`,
    });

    if (result.toolFailures.length > 0 && !result.postedGroupMessage) {
      await sendElisaMessageToGroup({
        groupId: params.groupId,
        userId: params.userId,
        content: buildFailureReply(result.toolFailures[0]?.error ?? 'falha ao executar ferramenta'),
        io: params.io,
        registerFollowUp: false,
      });
    }
  } catch (err: any) {
    await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: buildFailureReply(err?.message || 'erro inesperado'),
      io: params.io,
      registerFollowUp: false,
    });
  }

  const updated = await getFollowUpState(params.userId, params.groupId);
  if (updated && updated.turnsLeft <= 0) {
    await clearFollowUpState(params.userId, params.groupId);
  }

  return true;
}

function getToolDeclarations(message: string, sourceGroupId?: string) {
  const text = message.toLowerCase();
  const all: Record<string, any> = {
    criar_tarefa: {
      name: 'criar_tarefa',
      description: 'Criar tarefa',
      parametersJsonSchema: {
        type: 'object',
        properties: { title: { type: 'string' }, description: { type: 'string' }, groupName: { type: 'string' } },
        required: ['title'],
      },
    },
    criar_grupo: {
      name: 'criar_grupo',
      description: 'Criar grupo',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          userEmails: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'userEmails'],
      },
    },
    buscar_tarefas: {
      name: 'buscar_tarefas',
      description: 'Buscar tarefas',
      parametersJsonSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'integer' } },
        required: ['query'],
      },
    },
    marcar_concluida: {
      name: 'marcar_concluida',
      description: 'Concluir tarefa',
      parametersJsonSchema: {
        type: 'object',
        properties: { title: { type: 'string' }, groupName: { type: 'string' } },
        required: ['title'],
      },
    },
    mover_para_grupo: {
      name: 'mover_para_grupo',
      description: 'Mover tarefa de grupo',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'integer' },
          title: { type: 'string' },
          fromGroupName: { type: 'string' },
          groupNameDestination: { type: 'string' },
          moveToNoGroup: { type: 'boolean' },
        },
        anyOf: [{ required: ['taskId'] }, { required: ['title'] }],
      },
    },
    list_group_members: {
      name: 'list_group_members',
      description: 'Listar membros',
      parametersJsonSchema: {
        type: 'object',
        properties: { groupName: { type: 'string' }, groupId: { type: 'string' } },
      },
    },
    list_group_history: {
      name: 'list_group_history',
      description: 'Listar historico do grupo',
      parametersJsonSchema: {
        type: 'object',
        properties: { groupName: { type: 'string' }, groupId: { type: 'string' }, limit: { type: 'integer' } },
      },
    },
    avisar_no_grupo: {
      name: 'avisar_no_grupo',
      description: 'Enviar mensagem no grupo',
      parametersJsonSchema: {
        type: 'object',
        properties: { content: { type: 'string' }, groupName: { type: 'string' }, groupId: { type: 'string' } },
        required: ['content'],
      },
    },
  };

  const selected = new Set<string>();

  if (/\b(criar|cria|crie)\b.*\btarefa\b|\bnova tarefa\b/.test(text)) selected.add('criar_tarefa');
  if (/\b(criar|cria|crie)\b.*\bgrupo\b|\bnovo grupo\b/.test(text)) selected.add('criar_grupo');
  if (/buscar|procur|encontr|listar tarefa/.test(text)) selected.add('buscar_tarefas');
  if (/conclu|finaliz|completei|marcar.*conclu/.test(text)) selected.add('marcar_concluida');
  if (/mover|trocar.*grupo|sem grupo/.test(text)) selected.add('mover_para_grupo');
  if (/membros?|quantas pessoas|quem.*grupo/.test(text)) selected.add('list_group_members');
  if (/historico|ultimas mensagens|contexto do grupo/.test(text)) selected.add('list_group_history');
  if (/avise no grupo|avisar no grupo|manda no grupo|envia no grupo/.test(text)) selected.add('avisar_no_grupo');

  if (sourceGroupId) {
    selected.add('list_group_history');
    selected.add('avisar_no_grupo');
  }

  if (selected.size === 0) {
    return [all.buscar_tarefas, all.criar_tarefa, all.avisar_no_grupo];
  }

  return Array.from(selected).map((name) => all[name]);
}

async function resolveUserGroup(
  userId: string,
  args: { groupId?: string; groupName?: string },
  fallbackGroupId?: string,
) {
  const { groups } = await listGroupsUseCase.execute(userId);

  if (args.groupId) {
    return (groups as any[]).find((group) => group.id === args.groupId) ?? null;
  }

  if (args.groupName) {
    return (groups as any[]).find((group) => group.name?.toLowerCase() === args.groupName?.toLowerCase()) ?? null;
  }

  if (fallbackGroupId) {
    return (groups as any[]).find((group) => group.id === fallbackGroupId) ?? null;
  }

  return null;
}

function toToolTask(todo: any, group: { id: string; name: string } | null = null) {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description ?? null,
    completed: Boolean(todo.completed),
    group,
  };
}

async function runTool(
  call: { name: string; args: unknown },
  userId: string,
  actions: AssistantAction[],
  runtime: AssistantRuntimeContext,
) {
  try {
    if (call.name === 'criar_tarefa') {
      const args = createTaskArgsSchema.parse(call.args || {});
      let groupId: string | undefined;
      let groupData: { id: string; name: string } | null = null;

      if (args.groupName) {
        const group = await resolveUserGroup(userId, { groupName: args.groupName });
        if (!group) {
          return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
        }

        groupId = group.id;
        groupData = { id: group.id, name: group.name };
      }

      const { todo } = await createTodoUseCase.execute({
        title: args.title,
        userId,
        description: args.description,
        groupId,
      });

      const task = toToolTask(todo, groupData);

      actions.push({ type: 'task_created', id: task.id });

      return {
        ok: true,
        task,
      };
    }

    if (call.name === 'criar_grupo') {
      const args = createGroupArgsSchema.parse(call.args || {});
      const group = await createGroupUseCase.execute({
        name: args.name,
        description: args.description,
        userEmails: args.userEmails,
      });

      actions.push({ type: 'group_created', id: group.id });

      return {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
        },
      };
    }

    if (call.name === 'buscar_tarefas') {
      const args = searchTasksArgsSchema.parse(call.args || {});
      const { todos } = await selectTodosUseCase.execute({ userId });
      const query = args.query.toLowerCase();
      const tasks = todos
        .filter((todo) =>
          todo.title.toLowerCase().includes(query)
          || (todo.description ?? '').toLowerCase().includes(query),
        )
        .slice(0, args.limit ?? 5)
        .map((todo) => toToolTask(
          todo,
          todo.group ? { id: todo.group.id, name: todo.group.name } : null,
        ));

      return {
        ok: true,
        query: args.query,
        tasks,
      };
    }

    if (call.name === 'marcar_concluida') {
      const args = markTaskDoneArgsSchema.parse(call.args || {});
      const { todos } = await selectTodosUseCase.execute({ userId });
      const selected = todos.find((todo) => {
        const titleMatches = todo.title.toLowerCase().includes(args.title.toLowerCase());
        if (!titleMatches) return false;

        if (!args.groupName) return true;
        return todo.group?.name?.toLowerCase() === args.groupName.toLowerCase();
      });

      if (!selected) {
        return { ok: false, error: 'Tarefa nao encontrada para marcar como concluida.' };
      }

      const { todo } = await completeTodoUseCase.execute({
        todoId: selected.id,
        userId,
      });

      const task = toToolTask(
        todo,
        selected.group ? { id: selected.group.id, name: selected.group.name } : null,
      );

      actions.push({ type: 'task_completed', id: task.id });

      return {
        ok: true,
        task,
      };
    }

    if (call.name === 'mover_para_grupo') {
      const args = moveTaskArgsSchema.parse(call.args || {});
      let destinationGroupId: string | null = null;
      let destinationGroup: { id: string; name: string } | null = null;

      if (!args.moveToNoGroup) {
        const resolved = await resolveUserGroup(userId, { groupName: args.groupNameDestination });
        if (!resolved) {
          return { ok: false, error: 'Grupo de destino nao encontrado para este usuario.' };
        }

        destinationGroupId = resolved.id;
        destinationGroup = { id: resolved.id, name: resolved.name };
      }

      const { todos } = await selectTodosUseCase.execute({ userId });
      const candidates = todos.filter((todo) => {
        if (args.taskId && todo.id !== args.taskId) return false;
        if (!args.taskId && !(todo.title.toLowerCase().includes((args.title ?? '').toLowerCase()))) return false;
        if (!args.fromGroupName) return true;
        return todo.group?.name?.toLowerCase() === args.fromGroupName.toLowerCase();
      });

      if (candidates.length === 0) {
        return { ok: false, error: 'Tarefa nao encontrada para mover.' };
      }

      if (!args.taskId && candidates.length > 1) {
        return {
          ok: false,
          error: 'Encontrei mais de uma tarefa com esse titulo. Informe taskId para mover a tarefa correta.',
          candidates: candidates.map((todo) => ({
            id: todo.id,
            title: todo.title,
            group: todo.group?.name ?? null,
          })),
        };
      }

      const selected = candidates[0];
      const currentGroupId = selected.group?.id ?? null;
      if (currentGroupId === destinationGroupId) {
        return { ok: false, error: 'A tarefa ja esta no destino informado.' };
      }

      const { todo } = await updateTodoUseCase.execute({
        todoId: selected.id,
        userId,
        title: selected.title,
        groupId: destinationGroupId,
      });

      const task = toToolTask(todo, destinationGroup);

      actions.push({ type: 'task_moved', id: task.id, groupId: task.group?.id ?? null });

      return {
        ok: true,
        task,
      };
    }

    if (call.name === 'list_group_members') {
      const args = listGroupMembersArgsSchema.parse(call.args || {});
      const group = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (!group) {
        return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
      }

      const members = (group.members ?? [])
        .map((member: any) => member.user)
        .filter(Boolean)
        .map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
        }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

      return {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
        },
        count: members.length,
        members,
      };
    }

    if (call.name === 'list_group_history') {
      const args = listGroupHistoryArgsSchema.parse(call.args || {});
      const group = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (!group) {
        return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
      }

      const { messages } = await listGroupMessagesUseCase.execute(group.id);
      const recent = messages.slice(-(args.limit ?? 10));

      return {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
        },
        messages: recent.map((message) => ({
          id: message.id,
          authorId: message.authorId,
          authorName: message.authorName ?? message.authorId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        })),
      };
    }

    if (call.name === 'avisar_no_grupo') {
      const args = postGroupNoticeArgsSchema.parse(call.args || {});
      const group = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (!group) {
        return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
      }

      const { message } = await createGroupMessageUseCase.execute({
        groupId: group.id,
        authorId: userId,
        content: normalizeElisaContent(args.content),
      });

      const result = {
        group: { id: group.id, name: group.name },
        groupMessage: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          kind: message.kind,
          authorId: message.authorId,
          authorName: message.authorName ?? null,
          groupId: message.groupId,
          todoId: message.todoId,
        },
      };

      actions.push({ type: 'group_message_sent', id: result.groupMessage.id, groupId: result.group.id });

      return {
        ok: true,
        ...result,
      };
    }

    return { ok: false, error: 'Ferramenta desconhecida.' };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Falha ao executar ferramenta.',
      ...(Array.isArray(err?.candidates) ? { candidates: err.candidates } : {}),
    };
  }
}

export async function processAssistantMessage({
  userId,
  message,
  sourceGroupId,
  autoPostToSourceGroup,
  skipThreadHistory,
  persistInAssistantHistory,
  io,
}: AssistantProcessParams) {
  if (!env.IAAPIKEY) {
    throw new Error('IAAPIKEY nao configurada.');
  }

  if (sourceGroupId) {
    const allowedGroup = await prisma.group.findFirst({
      where: {
        id: sourceGroupId,
        members: { some: { userId } },
      },
      select: { id: true, name: true },
    });

    if (!allowedGroup) {
      throw new Error('Usuario nao pertence ao grupo informado.');
    }
  }

  const shouldPersist = persistInAssistantHistory !== false;
  const thread = shouldPersist
    ? await getOrCreateThread(userId)
    : await prisma.assistantThread.findUnique({ where: { userId }, select: { id: true } });

  let userMessage: any = null;
  if (shouldPersist && thread) {
    userMessage = await prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'USER',
        content: message,
      },
    });
  }

  const history = (skipThreadHistory || !thread)
    ? []
    : await prisma.assistantMessage.findMany({
      where: {
        threadId: thread.id,
        NOT: [
          { content: { startsWith: `${ELISA_STATE_PREFIX}|` } },
          ...INTERNAL_GROUP_ORCHESTRATION_PREFIXES.map((prefix) => ({
            content: { startsWith: prefix },
          })),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });

  const contents: any[] = skipThreadHistory ? [] : buildThreadContents(history);

  if (sourceGroupId) {
    const group = await prisma.group.findFirst({
      where: { id: sourceGroupId, members: { some: { userId } } },
      select: { id: true, name: true },
    });

    if (group) {
      const groupMessages = await prisma.message.findMany({
        where: { groupId: group.id },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_GROUP_CONTEXT_MESSAGES,
      });

      const normalizedMessages = groupMessages
        .slice()
        .reverse()
        .map((m) => ({
          authorName: m.author?.name ?? 'Sem nome',
          content: m.content,
          createdAt: m.createdAt,
        }));

      contents.push({
        role: 'user',
        parts: [{ text: buildGroupHistoryPrompt(group.name, normalizedMessages) }],
      });

      const summaryMemory = await getRecentGroupSummaryMemory(userId, group.id);
      if (summaryMemory.length > 0) {
        contents.push({
          role: 'user',
          parts: [{ text: `Memoria de resumos do grupo:\n${summaryMemory.join('\n')}` }],
        });
      }
    }
  }

  const actions: AssistantAction[] = [];
  const toolDeclarations = getToolDeclarations(message, sourceGroupId);
  const runtime: AssistantRuntimeContext = { sourceGroupId };

  const firstResponse: any = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: toolDeclarations }],
      temperature: 0.4,
    },
  });

  let finalText: string | undefined = extractTextFromResponse(firstResponse);
  const toolFailures: Array<{ tool: string; error: string; errorId?: string }> = [];
  let currentResponse: any = firstResponse;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const functionCalls = currentResponse?.functionCalls ?? [];
    if (functionCalls.length === 0) break;

    let toolResults: Array<{ name: string; response: ToolResult }> = [];

    try {
      const roundActions: AssistantAction[] = [];
      const roundResults: Array<{ name: string; response: ToolResult }> = [];

      for (const call of functionCalls) {
        let result: ToolResult;
        try {
          result = await runTool(call, userId, roundActions, runtime);
        } catch (toolErr) {
          const toolErrorId = buildErrorId('assistant_tool_error');
          console.error('[assistant:tool:exception]', {
            errorId: toolErrorId,
            userId,
            threadId: thread?.id,
            toolName: call?.name,
            toolArgs: toSafeJson(call?.args),
            error: extractErrorDetails(toolErr),
          });

          result = {
            ok: false,
            error: 'Falha interna ao executar ferramenta.',
            errorId: toolErrorId,
          };
        }

        if (result.ok === false) {
          console.error('[assistant:tool:not_completed]', {
            userId,
            threadId: thread?.id,
            toolName: call?.name,
            toolArgs: toSafeJson(call?.args),
            toolResponse: toSafeJson(result),
          });

          throw new ToolExecutionFailed({
            tool: call?.name || 'ferramenta_desconhecida',
            args: call?.args,
            result,
          });
        }

        roundResults.push({ name: call.name, response: result });
      }

      actions.push(...roundActions);
      toolResults = roundResults;
    } catch (toolFlowErr) {
      if (toolFlowErr instanceof ToolExecutionFailed) {
        toolFailures.push({
          tool: toolFlowErr.failure.tool,
          error: toolFlowErr.failure.result.error || 'Falha sem detalhe.',
          errorId: toolFlowErr.failure.result.errorId,
        });
        finalText = buildRetryQuestion(toolFlowErr.failure);
        break;
      }

      throw toolFlowErr;
    }

    if (io) {
      for (const result of toolResults) {
        const groupMessage = result.response.groupMessage as
          | {
            groupId?: string;
          }
          | undefined;

        if (groupMessage?.groupId) {
          io.to(`group:${groupMessage.groupId}`).emit('group:message', result.response.groupMessage);
        }
      }
    }

    const modelCallContent = currentResponse?.candidates?.[0]?.content;
    if (modelCallContent) contents.push(modelCallContent);

    contents.push({
      role: 'user',
      parts: toolResults.map((r) => ({ functionResponse: r })),
    });

    currentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.4,
      },
    });

    finalText = extractTextFromResponse(currentResponse) ?? finalText;
  }

  const safeText = (
    finalText
      || (actions.length > 0
        ? 'Acao concluida com sucesso. Se quiser, eu detalho o que foi feito.'
        : 'Nao consegui gerar uma resposta de texto agora. Pode repetir o pedido com mais detalhes?')
  ).trim();

  let assistantMessage: any = null;
  if (shouldPersist && thread) {
    assistantMessage = await prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'ASSISTANT',
        content: safeText,
      },
    });
  }

  let postedGroupMessage: any = null;
  const alreadySentToSourceGroup = actions.some(
    (action) => action.type === 'group_message_sent' && action.groupId === sourceGroupId,
  );

  if (sourceGroupId && autoPostToSourceGroup && !alreadySentToSourceGroup) {
    postedGroupMessage = await sendElisaMessageToGroup({
      groupId: sourceGroupId,
      userId,
      content: `ELISA: ${safeText}`,
      io,
    });

    actions.push({ type: 'group_message_sent', id: postedGroupMessage.id, groupId: sourceGroupId });
  }

  return {
    userMessage,
    message: assistantMessage,
    actions,
    toolFailures,
    postedGroupMessage,
  };
}

export async function processAssistantMentionInGroup(params: {
  userId: string;
  groupId: string;
  rawMessage: string;
  io?: any;
}) {
  if (isGreetingOnlyToElisa(params.rawMessage)) {
    const postedGroupMessage = await sendElisaMessageToGroup({
      groupId: params.groupId,
      userId: params.userId,
      content: createGreetingReply(),
      io: params.io,
    });

    return {
      userMessage: null,
      message: null,
      actions: [{ type: 'group_message_sent', id: postedGroupMessage.id, groupId: params.groupId }],
      toolFailures: [],
      postedGroupMessage,
    };
  }

  return processAssistantMessage({
    userId: params.userId,
    sourceGroupId: params.groupId,
    autoPostToSourceGroup: true,
    skipThreadHistory: true,
    io: params.io,
    message: sanitizeMentionPrompt(params.rawMessage),
  });
}

export async function assistantChat(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { message, groupId, autoPostToGroup } = chatBodySchema.parse(request.body || {});
    const userId = (request.user as { sub: string }).sub;

    const result = await processAssistantMessage({
      userId,
      message,
      sourceGroupId: groupId,
      autoPostToSourceGroup: autoPostToGroup ?? false,
      io: (request.server as any).io,
    });

    return reply.status(200).send(result);
  } catch (err: any) {
    const errorId = buildErrorId('assistant_chat_error');
    console.error('[assistant:chat:failed]', {
      errorId,
      userId: (request.user as { sub?: string } | undefined)?.sub,
      body: toSafeJson(request.body),
      error: extractErrorDetails(err),
    });

    return reply.status(500).send({
      message: err?.message || 'Erro ao conversar com a ELISA.',
      errorId,
    });
  }
}
