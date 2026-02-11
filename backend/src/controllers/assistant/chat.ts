import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import type { Prisma } from '@prisma/client';
import { env } from '../../env/index.js';
import { prisma } from '../../utils/prismaClient.js';

// Configuracao base da ELISA (instrucao fixa para o modelo)
const SYSTEM_INSTRUCTION = `
Voce e a ELISA, assistente do projeto de tarefas.
Seu papel: criar tarefas, criar grupos e buscar tarefas.
Regras:
- Responda sempre em portugues do Brasil.
- Se o usuario pedir para criar tarefa, use a ferramenta "criar_tarefa".
- Se o usuario pedir para criar grupo, use a ferramenta "criar_grupo".
- Se o usuario pedir para encontrar tarefa, use a ferramenta "buscar_tarefas".
- Se o usuario pedir para mudar o status de uma tarefa ou dizer que concluiu, use a ferramenta "marcar_concluida".
- Se o usuario pedir para mover tarefa entre grupos, use a ferramenta "mover_para_grupo".
- Se o usuario pedir para mover tarefa para sem grupo, use a ferramenta "mover_para_grupo" com moveToNoGroup=true.
- Se o usuario pedir para saber quantas pessoas estao no grupo use a ferramenta "list_group_members".
- Se o usuario pedir varias acoes na mesma mensagem, execute TODAS em sequencia, na ordem solicitada.
- Nao finalize a resposta antes de tentar executar todas as acoes pedidas.
- Se faltar informacao, faca perguntas objetivas antes de agir.
`;

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_CONTEXT_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 5;

// Cliente Gemini (ELISA) usando a chave do env
const ai = new GoogleGenAI({ apiKey: env.IAAPIKEY });

const chatBodySchema = z.object({
  message: z.string().min(1, 'Mensagem obrigatoria'),
});

const createTaskArgsSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  groupName: z.string().optional(),
});

const createGroupArgsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
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
  groupName: z.string().min(1),
});

const moveTaskArgsSchema = z.object({
  // Preferir taskId evita ambiguidades quando existem tarefas com titulos parecidos.
  taskId: z.coerce.number().int().positive().optional(),
  // Mantido para linguagem natural quando o usuario nao informa ID.
  title: z.string().min(1).optional(),
  // Opcional para restringir a busca da tarefa ao grupo de origem.
  fromGroupName: z.string().optional(),
  // Nome do grupo de destino.
  groupNameDestination: z.string().optional(),
  // Quando true, move a tarefa para "sem grupo" (groupId = null).
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
  | { type: 'task_moved'; id: number; groupId: string | null };

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

type DbClient = Prisma.TransactionClient;

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

async function runTool(
  db: DbClient,
  call: { name: string; args: unknown },
  userId: string,
  actions: AssistantAction[],
) {
  // Centraliza as acoes que a ELISA pode executar
  if (call.name === 'criar_tarefa') {
    const args = createTaskArgsSchema.parse(call.args || {});
    let groupId: string | undefined;

    if (args.groupName) {
      const group = await db.group.findFirst({
        where: {
          name: args.groupName,
          members: { some: { userId } },
        },
      });

      if (!group) {
        return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
      }

      groupId = group.id;
    }

    const todo = await db.todo.create({
      data: {
        title: args.title,
        description: args.description ?? null,
        userId,
        groupId,
      },
      include: { group: { select: { id: true, name: true } } },
    });

    actions.push({ type: 'task_created', id: todo.id });

    return {
      ok: true,
      task: {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        group: todo.group ?? null,
      },
    };
  }

  if (call.name === 'criar_grupo') {
    const args = createGroupArgsSchema.parse(call.args || {});

    const exists = await db.group.findUnique({ where: { name: args.name } });
    if (exists) {
      return { ok: false, error: 'Ja existe um grupo com esse nome.' };
    }

    const group = await db.group.create({
      data: {
        name: args.name,
        description: args.description ?? null,
        members: {
          create: [{ userId }],
        },
      },
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

    const userGroups = await db.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    const tasks = await db.todo.findMany({
      where: {
        OR: [{ userId }, { groupId: { in: groupIds } }],
        AND: [
          {
            OR: [
              { title: { contains: args.query } },
              { description: { contains: args.query } },
            ],
          },
        ],
      },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: args.limit ?? 5,
    });

    return {
      ok: true,
      query: args.query,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        completed: t.completed,
        group: t.group ?? null,
      })),
    };
  }
  if (call.name === 'marcar_concluida') {
    const args = markTaskDoneArgsSchema.parse(call.args || {});
    let groupId: string | undefined;

    if (args.groupName) {
      const group = await db.group.findFirst({
        where: {
          name: args.groupName,
          members: { some: { userId } },
        },
      });

      if (!group) {
        return { ok: false, error: 'Grupo nao encontrado para este usuario.' };
      }

      groupId = group.id;
    }

    const userGroups = await db.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    const task = await db.todo.findFirst({
      where: {
        OR: [{ userId }, { groupId: { in: groupIds } }],
        title: { contains: args.title },
        ...(groupId ? { groupId } : {}),
      },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      return { ok: false, error: 'Tarefa nao encontrada para marcar como concluida.' };
    }

    const updatedTask = await db.todo.update({
      where: { id: task.id },
      data: { completed: true },
      include: { group: { select: { id: true, name: true } } },
    });

    actions.push({ type: 'task_completed', id: updatedTask.id });

    return {
      ok: true,
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        completed: updatedTask.completed,
        group: updatedTask.group ?? null,
      },
    };
  }
  if (call.name === 'mover_para_grupo') {
    const args = moveTaskArgsSchema.parse(call.args || {});
    let destinationGroupId: string | null = null;

    // Resolve destino: por nome de grupo ou "sem grupo".
    if (!args.moveToNoGroup) {
      const destinationGroup = await db.group.findFirst({
        where: {
          name: args.groupNameDestination,
          members: { some: { userId } },
        },
      });

      if (!destinationGroup) {
        return { ok: false, error: 'Grupo de destino nao encontrado para este usuario.' };
      }

      destinationGroupId = destinationGroup.id;
    }

    // Busca grupos do usuario para filtrar somente tarefas acessiveis.
    const userGroups = await db.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    let fromGroupId: string | null | undefined = undefined;
    if (args.fromGroupName) {
      const fromGroup = await db.group.findFirst({
        where: {
          name: args.fromGroupName,
          members: { some: { userId } },
        },
      });

      if (!fromGroup) {
        return { ok: false, error: 'Grupo de origem nao encontrado para este usuario.' };
      }

      fromGroupId = fromGroup.id;
    }

    // Se veio taskId, faz busca exata. Se veio titulo, pode trazer varias para desambiguar.
    const candidateTasks = await db.todo.findMany({
      where: {
        OR: [{ userId }, { groupId: { in: groupIds } }],
        ...(args.taskId ? { id: args.taskId } : { title: { contains: args.title ?? '' } }),
        ...(fromGroupId !== undefined ? { groupId: fromGroupId } : {}),
      },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: args.taskId ? 1 : 10,
    });

    if (candidateTasks.length === 0) {
      return { ok: false, error: 'Tarefa nao encontrada para mover.' };
    }

    if (!args.taskId && candidateTasks.length > 1) {
      return {
        ok: false,
        error: 'Encontrei mais de uma tarefa com esse titulo. Informe taskId para mover a tarefa correta.',
        candidates: candidateTasks.map((t) => ({
          id: t.id,
          title: t.title,
          group: t.group?.name ?? null,
        })),
      };
    }

    const task = candidateTasks[0];
    if ((task.groupId ?? null) === destinationGroupId) {
      return { ok: false, error: 'A tarefa ja esta no destino informado.' };
    }

    // Move a tarefa para o destino (ou remove do grupo quando destino = null).
    const updatedTask = await db.todo.update({
      where: { id: task.id },
      data: { groupId: destinationGroupId },
      include: { group: { select: { id: true, name: true }  } },
    });

    actions.push({ type: 'task_moved', id: updatedTask.id, groupId: destinationGroupId });

    return {
      ok: true,
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        completed: updatedTask.completed,
        group: updatedTask.group ?? null,
      },
    };
  }
  if (call.name === 'list_group_members') {
  const args = listGroupMembersArgsSchema.parse(call.args || {});

    const group = await prisma.group.findFirst({
      where: {
        name: args.groupName,
        members: { some: { userId } },
      },
      include: { members: { select: { userId: true } } },
    });

    console.log('Group members for', args.groupName, group?.members);

  }

  return { ok: false, error: 'Ferramenta desconhecida.' };
  
}


export async function assistantChat(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { message } = chatBodySchema.parse(request.body || {});

    if (!env.IAAPIKEY) {
      return reply.status(500).send({ message: 'IAAPIKEY nao configurada.' });
    }

    const userId = (request.user as { sub: string }).sub;
    const thread = await getOrCreateThread(userId);

    // Salva a mensagem do usuario para manter memoria persistente
    const userMessage = await prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'USER',
        content: message,
      },
    });

    // Busca as ultimas mensagens para contexto do modelo
    const history = await prisma.assistantMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });

    const contents: any[] = history
      .slice()
      .reverse()
      .map((m) => ({
        role: toModelRole(m.role),
        parts: [{ text: m.content }],
      }));

    const actions: AssistantAction[] = [];

    // Declaracao das ferramentas que a ELISA pode usar
    const toolDeclarations = [
      {
        name: 'criar_tarefa',
        description: 'Cria uma tarefa para o usuario logado',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Titulo da tarefa' },
            description: { type: 'string', description: 'Descricao da tarefa' },
            groupName: { type: 'string', description: 'Nome do grupo (opcional)' },
          },
          required: ['title'],
        },
      },
      {
        name: 'criar_grupo',
        description: 'Cria um grupo e adiciona o usuario como membro',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do grupo' },
            description: { type: 'string', description: 'Descricao do grupo' },
          },
          required: ['name'],
        },
      },
      {
        name: 'buscar_tarefas',
        description: 'Busca tarefas do usuario por texto',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto para busca' },
            limit: { type: 'integer', description: 'Quantidade maxima de resultados' },
          },
          required: ['query'],
        },
      },
      {
        name: 'marcar_concluida',
        description: 'Marcar tarefas como concluidas',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Titulo da tarefa' },
            description: { type: 'string', description: 'Descricao da tarefa (opcional)' },
            groupName: { type: 'string', description: 'Nome do grupo (opcional)' },
          },
          required: ['title'],
        },
      },
      {
        name: 'mover_para_grupo',
        description: 'Move uma tarefa para outro grupo ou para sem grupo',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'integer', description: 'ID da tarefa (preferencial para evitar ambiguidade)' },
            title: { type: 'string', description: 'Titulo da tarefa (use quando nao tiver taskId)' },
            fromGroupName: { type: 'string', description: 'Grupo de origem (opcional, para desambiguar)' },
            groupNameDestination: { type: 'string', description: 'Nome do grupo destino' },
            moveToNoGroup: { type: 'boolean', description: 'Se true, move para sem grupo' },
          },
          anyOf: [
            { required: ['taskId'] },
            { required: ['title'] },
          ],
        },

      },
      {
        name: 'list_group_members',
        description: 'Lista os membros de um grupo',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            groupName: { type: 'string', description: 'Nome do grupo' },
          },
          required: ['groupName'],
        },
        

      }
    ];

    // Chamada inicial para o modelo
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

      // Executa todas as ferramentas da rodada em transacao.
      // Se uma falhar, interrompe a rodada e faz rollback.
      let toolResults: Array<{ name: string; response: ToolResult }> = [];
      try {
        const txData = await prisma.$transaction(async (tx) => {
          const txActions: AssistantAction[] = [];
          const txResults: Array<{ name: string; response: ToolResult }> = [];

          for (const call of functionCalls) {
            let result: ToolResult;
            try {
              result = await runTool(tx, call, userId, txActions);
            } catch (toolErr) {
              const toolErrorId = buildErrorId('assistant_tool_error');
              console.error('[assistant:tool:exception]', {
                errorId: toolErrorId,
                userId,
                threadId: thread.id,
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
                threadId: thread.id,
                toolName: call?.name,
                toolArgs: toSafeJson(call?.args),
                toolResponse: toSafeJson(result),
                rollback: true,
              });

              throw new ToolExecutionFailed({
                tool: call?.name || 'ferramenta_desconhecida',
                args: call?.args,
                result,
              });
            }

            txResults.push({ name: call.name, response: result });
          }

          return { txActions, txResults };
        });

        actions.push(...txData.txActions);
        toolResults = txData.txResults;
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
    

    const safeText = (finalText || (actions.length > 0
      ? 'Acao concluida com sucesso. Se quiser, eu detalho o que foi feito.'
      : 'Nao consegui gerar uma resposta de texto agora. Pode repetir o pedido com mais detalhes?')).trim();

    const assistantMessage = await prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'ASSISTANT',
        content: safeText,
      },
    });

    return reply.status(200).send({
      userMessage,
      message: assistantMessage,
      actions,
      toolFailures,
    });
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
