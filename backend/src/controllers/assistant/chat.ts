import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
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
- Se o usuario pedir para mudar um grupo use a ferramenta "mover_para_grupo".
- Se faltar informacao, faca perguntas objetivas antes de agir.
`;

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_CONTEXT_MESSAGES = 20;

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

type AssistantAction =
  | { type: 'task_created'; id: number }
  | { type: 'group_created'; id: string }
  | { type: 'task_completed'; id: number };
  //| { type: 'task_moved', id: string };

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
  call: { name: string; args: unknown },
  userId: string,
  actions: AssistantAction[],
) {
  // Centraliza as acoes que a ELISA pode executar
  if (call.name === 'criar_tarefa') {
    const args = createTaskArgsSchema.parse(call.args || {});
    let groupId: string | undefined;

    if (args.groupName) {
      const group = await prisma.group.findFirst({
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

    const todo = await prisma.todo.create({
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

    const exists = await prisma.group.findUnique({ where: { name: args.name } });
    if (exists) {
      return { ok: false, error: 'Ja existe um grupo com esse nome.' };
    }

    const group = await prisma.group.create({
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

    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    const tasks = await prisma.todo.findMany({
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
      const group = await prisma.group.findFirst({
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

    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    const task = await prisma.todo.findFirst({
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

    const updatedTask = await prisma.todo.update({
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
    const args = markTaskDoneArgsSchema.parse(call.args || {});
    let groupId: string | undefined;
    console.log("args",args);
    if (args.groupName) {
      const group = await prisma.group.findFirst({
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

    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);
    console.log("grupos do usuario",userGroups);
    console.log("Id do grupo",groupIds);


    const task = await prisma.todo.findFirst({
      where: {
        OR: [{ userId }, { groupId: { in: groupIds } }],
        title: { contains: args.title },
        ...(groupId ? { groupId } : {}),
      },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    console.log("tarefa encontrada",task)
    if (!task) {
      return { ok: false, error: 'Tarefa nao encontrada para mover.' };
    }

    const updatedTask = await prisma.todo.update({
      where: { id: task.id },
      data: { groupId },
      include: { group: { select: { id: true, name: true } } },
    });

    //actions.push({ type: 'task_moved', id: updatedTask.id });

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
        description: 'Mover uma tarefa para um grupo selecionado pelo usuario',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Titulo da tarefa' },
            groupNameDestination: { type: 'string', description: 'Nome do grupo destino' },
          },
          required: ['title', 'groupNameDestination'],
        },
      },
      
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
    const functionCalls = firstResponse.functionCalls ?? [];

    if (functionCalls.length > 0) {
      // Executa as ferramentas solicitadas pelo modelo
      const toolResults = [];
      for (const call of functionCalls) {
        const result = await runTool(call, userId, actions);
        toolResults.push({ name: call.name, response: result });
      }

      // Adiciona a chamada da funcao e a resposta da funcao no contexto
      const modelCallContent = firstResponse.candidates?.[0]?.content;
      if (modelCallContent) contents.push(modelCallContent);

      contents.push({
        role: 'user',
        parts: toolResults.map((r) => ({ functionResponse: r })),
      });

      const finalResponse: any = await ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: toolDeclarations }],
          temperature: 0.4,
        },
      });

      finalText = extractTextFromResponse(finalResponse) ?? finalText;
    }

    const safeText = (finalText || 'Sem resposta da ELISA.').trim();

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
    });
  } catch (err: any) {
    return reply.status(500).send({
      message: err?.message || 'Erro ao conversar com a ELISA.',
    });
  }
}
