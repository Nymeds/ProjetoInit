import { env } from "../../env/index.js";
import { prisma } from "../../utils/prismaClient.js";
import { aiClient } from "./client.js";
import {
  GREETING_PATTERN,
  MAX_CONTEXT_MESSAGES,
  MAX_TOOL_ROUNDS,
  MODEL_NAME,
  SYSTEM_INSTRUCTION,
} from "./config.js";
import { compactText } from "./helpers.js";
import { buildRetryQuestion, buildRuntimeContext, getToolDeclarations, runTool } from "./tools.js";
import type { AssistantAction, AssistantProcessParams, ToolFailure } from "./types.js";
import { assistantUseCases } from "./use-cases.js";

class ToolExecutionFailed extends Error {
  failure: ToolFailure;

  constructor(failure: ToolFailure) {
    super(failure.result.error || "Falha ao executar ferramenta.");
    this.name = "ToolExecutionFailed";
    this.failure = failure;
  }
}

function extractTextFromResponse(response: any): string | undefined {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  const text = parts
    .filter((part: any) => typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("");

  return text || undefined;
}

async function getOrCreateThread(userId: string) {
  return prisma.assistantThread.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function toModelRole(role: "USER" | "ASSISTANT") {
  return role === "USER" ? "user" : "model";
}

function buildThreadContents(history: Array<{ role: "USER" | "ASSISTANT"; content: string }>) {
  return history.map((item) => ({
    role: toModelRole(item.role),
    parts: [{ text: compactText(item.content, 1000) }],
  }));
}

function sanitizeMentionPrompt(message: string) {
  return message.replace(/\belisa\b[:,\-]?\s*/i, "").trim() || message.trim();
}

function isGreetingOnlyToElisa(message: string) {
  return GREETING_PATTERN.test(sanitizeMentionPrompt(message));
}

function createGreetingReply() {
  return "ELISA: Oi! Estou por aqui. Me diga o que voce precisa.";
}

function normalizeElisaContent(content: string) {
  const trimmed = content.trim();
  return /^elisa:/i.test(trimmed) ? trimmed : `ELISA: ${trimmed}`;
}

export async function sendElisaMessageToGroup(params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
  registerFollowUp?: boolean;
}) {
  const { message } = await assistantUseCases.createGroupMessage.execute({
    groupId: params.groupId,
    authorId: params.userId,
    content: normalizeElisaContent(params.content),
  });

  const payload = {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    kind: message.kind,
    authorId: message.authorId,
    authorName: message.authorName ?? null,
    groupId: message.groupId,
    todoId: message.todoId,
  };

  if (params.io) {
    params.io.to(`group:${params.groupId}`).emit("group:message", payload);
  }

  return payload;
}

export async function maybeStoreGroupSummaryMemory(_params: {
  groupId: string;
}) {
  return;
}

export async function maybePromptTaskActionInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return;
}

export async function maybeHandleTaskConfirmationInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return false;
}

export async function maybeHandleAssistantFollowUpInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return false;
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
    throw new Error("IAAPIKEY nao configurada.");
  }

  const { groups: userGroups } = await assistantUseCases.listGroups.execute(userId);
  const sourceGroup = sourceGroupId
    ? (userGroups as Array<{ id: string }>).find((group) => group.id === sourceGroupId) ?? null
    : null;

  if (sourceGroupId && !sourceGroup) {
    throw new Error("Usuario nao pertence ao grupo informado.");
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
        role: "USER",
        content: message,
      },
    });
  }

  const history = (skipThreadHistory || !thread)
    ? []
    : await prisma.assistantMessage.findMany({
      where: {
        threadId: thread.id,
        role: { in: ["USER", "ASSISTANT"] },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_CONTEXT_MESSAGES,
    });

  const chronologicalHistory = history
    .slice()
    .reverse() as Array<{ role: "USER" | "ASSISTANT"; content: string }>;

  const contents: any[] = skipThreadHistory ? [] : buildThreadContents(chronologicalHistory);
  if (!shouldPersist || skipThreadHistory) {
    contents.push({
      role: "user",
      parts: [{ text: compactText(message, 1000) }],
    });
  }

  const recentUserMessages = chronologicalHistory
    .filter((item) => item.role === "USER")
    .map((item) => item.content);
  if (!shouldPersist || skipThreadHistory) {
    recentUserMessages.push(message);
  }

  const runtime = await buildRuntimeContext({
    userId,
    message,
    sourceGroupId,
    recentUserMessages: recentUserMessages.slice(-8),
  });
  const toolDeclarations = getToolDeclarations(message, sourceGroupId);

  let currentResponse: any = await aiClient.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: toolDeclarations }],
      temperature: 0.3,
    },
  });

  let finalText: string | undefined = extractTextFromResponse(currentResponse);
  const actions: AssistantAction[] = [];
  const toolFailures: Array<{ tool: string; error: string; errorId?: string }> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const functionCalls = currentResponse?.functionCalls ?? [];
    if (!Array.isArray(functionCalls) || functionCalls.length === 0) break;

    const toolResults: Array<{ name: string; response: any }> = [];

    try {
      for (const call of functionCalls) {
        const name = typeof call?.name === "string" ? call.name : "ferramenta_desconhecida";
        const args = call?.args ?? {};
        const result = await runTool({ name, args }, userId, actions, runtime);

        if (!result.ok) {
          throw new ToolExecutionFailed({
            tool: name,
            args,
            result,
          });
        }

        toolResults.push({ name, response: result });
      }
    } catch (err: any) {
      if (err instanceof ToolExecutionFailed) {
        toolFailures.push({
          tool: err.failure.tool,
          error: err.failure.result.error || "Falha sem detalhe.",
          errorId: err.failure.result.errorId,
        });
        finalText = buildRetryQuestion(err.failure);
        break;
      }

      throw err;
    }

    if (io) {
      for (const result of toolResults) {
        const groupMessage = result.response.groupMessage as { groupId?: string } | undefined;
        if (groupMessage?.groupId) {
          io.to(`group:${groupMessage.groupId}`).emit("group:message", groupMessage);
        }
      }
    }

    const modelCallContent = currentResponse?.candidates?.[0]?.content;
    if (modelCallContent) {
      contents.push(modelCallContent);
    }

    contents.push({
      role: "user",
      parts: toolResults.map((item) => ({ functionResponse: item })),
    });

    currentResponse = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.3,
      },
    });

    finalText = extractTextFromResponse(currentResponse) ?? finalText;
  }

  const safeText = (
    finalText
    || (actions.length > 0
      ? "Pronto. Conclui a acao solicitada."
      : "Nao consegui interpretar com seguranca. Reescreva em uma frase curta com acao + alvo.")
  ).trim();

  let assistantMessage: any = null;
  if (shouldPersist && thread) {
    assistantMessage = await prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: "ASSISTANT",
        content: safeText,
      },
    });
  }

  let postedGroupMessage: any = null;
  const alreadySentToSourceGroup = actions.some(
    (action) => action.type === "group_message_sent" && action.groupId === sourceGroupId,
  );

  if (sourceGroupId && autoPostToSourceGroup && !alreadySentToSourceGroup) {
    postedGroupMessage = await sendElisaMessageToGroup({
      groupId: sourceGroupId,
      userId,
      content: safeText,
      io,
    });
    actions.push({ type: "group_message_sent", id: postedGroupMessage.id, groupId: sourceGroupId });
  }

  return {
    userMessage,
    message: assistantMessage,
    actions,
    toolFailures,
    postedGroupMessage,
    reply: safeText,
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
      actions: [{ type: "group_message_sent", id: postedGroupMessage.id, groupId: params.groupId }],
      toolFailures: [],
      postedGroupMessage,
      reply: postedGroupMessage.content,
    };
  }

  return processAssistantMessage({
    userId: params.userId,
    sourceGroupId: params.groupId,
    autoPostToSourceGroup: true,
    skipThreadHistory: true,
    persistInAssistantHistory: false,
    io: params.io,
    message: sanitizeMentionPrompt(params.rawMessage),
  });
}
