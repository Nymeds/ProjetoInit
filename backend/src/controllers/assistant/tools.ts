import { z } from "zod";
import { compactText, normalizeText } from "./helpers.js";
import type {
  AssistantAction,
  AssistantRuntimeContext,
  ToolCandidate,
  ToolFailure,
  ToolResult,
} from "./types.js";
import { assistantUseCases } from "./use-cases.js";

const SENSITIVE_CONFIRMATION_PREFIX = "CONFIRM_REQUIRED|";

const createTaskArgsSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  withoutGroup: z.boolean().optional(),
});

const searchTasksArgsSchema = z.object({
  query: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
  includeCompleted: z.boolean().optional(),
});

const markTaskDoneArgsSchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
}).superRefine((args, ctx) => {
  if (!args.taskId && !args.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe taskId ou title.",
    });
  }
});

const moveTaskArgsSchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  taskIds: z.array(z.coerce.number().int().positive()).min(1).optional(),
  title: z.string().min(1).optional(),
  numberParity: z.enum(["even", "odd", "par", "impar"]).optional(),
  moveAllMatches: z.boolean().optional(),
  fromGroupName: z.string().min(1).optional(),
  groupNameDestination: z.string().min(1).optional(),
  groupIdDestination: z.string().min(1).optional(),
  moveToNoGroup: z.boolean().optional(),
}).superRefine((args, ctx) => {
  if (!args.taskId && !(args.taskIds?.length) && !args.title && !args.numberParity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe taskId, taskIds, title ou numberParity para identificar a tarefa.",
    });
  }
  if (!args.moveToNoGroup && !args.groupNameDestination && !args.groupIdDestination) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe groupNameDestination/groupIdDestination ou moveToNoGroup=true.",
    });
  }
});

const updateTaskArgsSchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  titleMatch: z.string().min(1).optional(),
  newTitle: z.string().min(1).optional(),
  groupNameDestination: z.string().min(1).optional(),
  groupIdDestination: z.string().min(1).optional(),
  moveToNoGroup: z.boolean().optional(),
}).superRefine((args, ctx) => {
  if (!args.taskId && !args.titleMatch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe taskId ou titleMatch para identificar a tarefa.",
    });
  }
  if (!args.newTitle && !args.groupNameDestination && !args.groupIdDestination && !args.moveToNoGroup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe newTitle e/ou destino de grupo para atualizar.",
    });
  }
});

const deleteTaskArgsSchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  confirm: z.boolean().optional(),
}).superRefine((args, ctx) => {
  if (!args.taskId && !args.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe taskId ou title para deletar a tarefa.",
    });
  }
});

const createGroupArgsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  userEmails: z.array(z.string().email()).optional(),
  copyMembersFromGroupName: z.string().min(1).optional(),
  copyMembersFromGroupId: z.string().min(1).optional(),
  fromGroupName: z.string().min(1).optional(),
  fromGroupId: z.string().min(1).optional(),
  includeAcceptedFriends: z.boolean().optional(),
});

const listGroupsArgsSchema = z.object({});

const updateGroupArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  addUserEmails: z.array(z.string().email()).optional(),
  removeUserIds: z.array(z.string().min(1)).optional(),
  relatedGroupIds: z.array(z.string().min(1)).optional(),
  relatedGroupNames: z.array(z.string().min(1)).optional(),
  confirm: z.boolean().optional(),
}).superRefine((args, ctx) => {
  const hasUpdates = args.name !== undefined
    || args.description !== undefined
    || (args.addUserEmails?.length ?? 0) > 0
    || (args.removeUserIds?.length ?? 0) > 0
    || args.relatedGroupIds !== undefined
    || args.relatedGroupNames !== undefined;

  if (!hasUpdates) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe campos para atualizar o grupo.",
    });
  }
});

const deleteGroupArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  confirm: z.boolean().optional(),
});

const leaveGroupArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  confirm: z.boolean().optional(),
});

const listGroupMembersArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
});

const listGroupHistoryArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const listGroupMessagesArgsSchema = z.object({
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const listFriendsArgsSchema = z.object({});

const postGroupNoticeArgsSchema = z.object({
  content: z.string().min(1),
  groupName: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
});

const listTodoMessagesArgsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  kind: z.enum(["COMMENT", "CHAT"]).optional(),
});

const createTodoMessageArgsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  content: z.string().min(1),
  kind: z.enum(["COMMENT", "CHAT"]).optional(),
});

const updateTodoMessageArgsSchema = z.object({
  commentId: z.string().min(1),
  content: z.string().min(1),
  taskId: z.coerce.number().int().positive().optional(),
});

const deleteTodoMessageArgsSchema = z.object({
  commentId: z.string().min(1),
  taskId: z.coerce.number().int().positive().optional(),
  confirm: z.boolean().optional(),
});

const allToolDeclarations: Record<string, any> = {
  criar_tarefa: {
    name: "criar_tarefa",
    description: "Criar tarefa com ou sem grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        groupName: { type: "string" },
        groupId: { type: "string" },
        withoutGroup: { type: "boolean" },
      },
      required: ["title"],
    },
  },
  buscar_tarefas: {
    name: "buscar_tarefas",
    description: "Buscar/listar tarefas visiveis",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        groupName: { type: "string" },
        limit: { type: "integer" },
        includeCompleted: { type: "boolean" },
      },
    },
  },
  marcar_concluida: {
    name: "marcar_concluida",
    description: "Marcar tarefa como concluida",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        title: { type: "string" },
        groupName: { type: "string" },
      },
    },
  },
  atualizar_tarefa: {
    name: "atualizar_tarefa",
    description: "Atualizar titulo e/ou grupo de uma tarefa",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        titleMatch: { type: "string" },
        newTitle: { type: "string" },
        groupNameDestination: { type: "string" },
        groupIdDestination: { type: "string" },
        moveToNoGroup: { type: "boolean" },
      },
    },
  },
  mover_para_grupo: {
    name: "mover_para_grupo",
    description: "Mover uma ou varias tarefas para grupo ou sem grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        taskIds: { type: "array", items: { type: "integer" } },
        title: { type: "string" },
        numberParity: { type: "string", enum: ["even", "odd", "par", "impar"] },
        moveAllMatches: { type: "boolean" },
        fromGroupName: { type: "string" },
        groupNameDestination: { type: "string" },
        groupIdDestination: { type: "string" },
        moveToNoGroup: { type: "boolean" },
      },
    },
  },
  deletar_tarefa: {
    name: "deletar_tarefa",
    description: "Deletar tarefa (acao sensivel, exige confirmacao)",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        title: { type: "string" },
        groupName: { type: "string" },
        confirm: { type: "boolean" },
      },
    },
  },
  criar_grupo: {
    name: "criar_grupo",
    description: "Criar grupo com membros por email, por copia de grupo ou amigos aceitos",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        userEmails: { type: "array", items: { type: "string" } },
        copyMembersFromGroupName: { type: "string" },
        copyMembersFromGroupId: { type: "string" },
        fromGroupName: { type: "string" },
        fromGroupId: { type: "string" },
        includeAcceptedFriends: { type: "boolean" },
      },
      required: ["name"],
    },
  },
  listar_grupos: {
    name: "listar_grupos",
    description: "Listar grupos do usuario",
    parametersJsonSchema: {
      type: "object",
      properties: {},
    },
  },
  atualizar_grupo: {
    name: "atualizar_grupo",
    description: "Atualizar configuracoes e membros do grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        addUserEmails: { type: "array", items: { type: "string" } },
        removeUserIds: { type: "array", items: { type: "string" } },
        relatedGroupIds: { type: "array", items: { type: "string" } },
        relatedGroupNames: { type: "array", items: { type: "string" } },
        confirm: { type: "boolean" },
      },
    },
  },
  deletar_grupo: {
    name: "deletar_grupo",
    description: "Deletar grupo (acao sensivel, exige confirmacao)",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
        confirm: { type: "boolean" },
      },
    },
  },
  sair_do_grupo: {
    name: "sair_do_grupo",
    description: "Sair de um grupo (acao sensivel, exige confirmacao)",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
        confirm: { type: "boolean" },
      },
    },
  },
  list_group_members: {
    name: "list_group_members",
    description: "Listar membros de grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
      },
    },
  },
  list_group_history: {
    name: "list_group_history",
    description: "Listar historico de tarefas do grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
        limit: { type: "integer" },
      },
    },
  },
  list_group_messages: {
    name: "list_group_messages",
    description: "Listar mensagens recentes do grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        groupName: { type: "string" },
        groupId: { type: "string" },
        limit: { type: "integer" },
      },
    },
  },
  listar_amigos: {
    name: "listar_amigos",
    description: "Listar amigos aceitos do usuario",
    parametersJsonSchema: {
      type: "object",
      properties: {},
    },
  },
  avisar_no_grupo: {
    name: "avisar_no_grupo",
    description: "Enviar mensagem no grupo",
    parametersJsonSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        groupName: { type: "string" },
        groupId: { type: "string" },
      },
      required: ["content"],
    },
  },
  listar_mensagens_tarefa: {
    name: "listar_mensagens_tarefa",
    description: "Listar comentarios/chat de tarefa",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        kind: { type: "string", enum: ["COMMENT", "CHAT"] },
      },
      required: ["taskId"],
    },
  },
  comentar_tarefa: {
    name: "comentar_tarefa",
    description: "Criar comentario/chat em tarefa",
    parametersJsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "integer" },
        content: { type: "string" },
        kind: { type: "string", enum: ["COMMENT", "CHAT"] },
      },
      required: ["taskId", "content"],
    },
  },
  editar_comentario_tarefa: {
    name: "editar_comentario_tarefa",
    description: "Editar comentario de tarefa",
    parametersJsonSchema: {
      type: "object",
      properties: {
        commentId: { type: "string" },
        content: { type: "string" },
        taskId: { type: "integer" },
      },
      required: ["commentId", "content"],
    },
  },
  deletar_comentario_tarefa: {
    name: "deletar_comentario_tarefa",
    description: "Deletar comentario de tarefa (acao sensivel, exige confirmacao)",
    parametersJsonSchema: {
      type: "object",
      properties: {
        commentId: { type: "string" },
        taskId: { type: "integer" },
        confirm: { type: "boolean" },
      },
      required: ["commentId"],
    },
  },
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMentionedGroup(groups: any[], text: string) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return null;

  const sorted = groups.slice().sort((a, b) => normalizeText(b.name).length - normalizeText(a.name).length);
  for (const group of sorted) {
    const normalizedName = normalizeText(group.name);
    if (normalizedName.length < 3) continue;

    const boundary = new RegExp(`\\b${escapeRegex(normalizedName)}\\b`);
    if (boundary.test(normalizedText) || normalizedText.includes(`grupo ${normalizedName}`)) {
      return group;
    }
  }

  return null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeElisaContent(content: string) {
  const trimmed = content.trim();
  return /^elisa:/i.test(trimmed) ? trimmed : `ELISA: ${trimmed}`;
}

function extractTaskNumberFromTitle(title: string): number | null {
  const matches = title.match(/\d+/g);
  if (!matches || matches.length === 0) return null;

  const lastValue = Number(matches[matches.length - 1]);
  return Number.isFinite(lastValue) ? lastValue : null;
}

function parseParity(parity?: "even" | "odd" | "par" | "impar") {
  if (!parity) return undefined;
  if (parity === "par") return "even";
  if (parity === "impar") return "odd";
  return parity;
}

function toTaskCandidate(task: any): ToolCandidate {
  return {
    id: task.id,
    title: task.title,
    group: task.group?.name ?? null,
  };
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

function isNoGroupRequest(text: string) {
  const normalized = normalizeText(text);
  return /\bsem grupo\b|\bfora de grupo\b/.test(normalized);
}

function inferTaskDescription(title: string, runtime: AssistantRuntimeContext) {
  const normalizedTitle = normalizeText(title);
  const contextCandidates = [
    runtime.rawUserMessage,
    ...runtime.recentUserMessages,
  ]
    .map((item) => compactText(item, 220))
    .filter(Boolean);

  for (const candidate of contextCandidates) {
    if (normalizeText(candidate) !== normalizedTitle) {
      return `Contexto do pedido: ${candidate}`;
    }
  }

  if (runtime.preferredGroupName) {
    return `Tarefa relacionada ao grupo ${runtime.preferredGroupName}.`;
  }

  return `Descricao inferida automaticamente para a tarefa "${title}".`;
}

async function listVisibleTodos(userId: string) {
  const { todos } = await assistantUseCases.selectTodos.execute({ userId });
  return todos;
}

async function ensureTodoVisible(userId: string, taskId: number) {
  const todos = await listVisibleTodos(userId);
  const selected = todos.find((todo) => todo.id === taskId);
  if (!selected) {
    throw new Error("Tarefa nao encontrada para este usuario.");
  }
  return selected;
}

type ResolveGroupResult = {
  group: any | null;
  ambiguousCandidates?: ToolCandidate[];
};

async function resolveUserGroup(
  userId: string,
  args: { groupId?: string; groupName?: string },
  fallbackGroupId?: string,
): Promise<ResolveGroupResult> {
  const { groups } = await assistantUseCases.listGroups.execute(userId);

  if (args.groupId) {
    return { group: (groups as any[]).find((item) => item.id === args.groupId) ?? null };
  }

  if (args.groupName) {
    const normalizedName = normalizeText(args.groupName);
    const exactMatches = (groups as any[]).filter((item) => normalizeText(item.name) === normalizedName);
    if (exactMatches.length === 1) {
      return { group: exactMatches[0] };
    }
    if (exactMatches.length > 1) {
      return {
        group: null,
        ambiguousCandidates: exactMatches.map((item) => ({ id: item.id, name: item.name })),
      };
    }

    const partialMatches = (groups as any[]).filter((item) => {
      const groupName = normalizeText(item.name);
      return groupName.includes(normalizedName) || normalizedName.includes(groupName);
    });
    if (partialMatches.length === 1) {
      return { group: partialMatches[0] };
    }
    if (partialMatches.length > 1) {
      return {
        group: null,
        ambiguousCandidates: partialMatches.map((item) => ({ id: item.id, name: item.name })),
      };
    }

    return { group: null };
  }

  if (fallbackGroupId) {
    return { group: (groups as any[]).find((item) => item.id === fallbackGroupId) ?? null };
  }

  return { group: null };
}

function buildSensitiveConfirmationError(actionDescription: string): ToolResult {
  return {
    ok: false,
    error: `${SENSITIVE_CONFIRMATION_PREFIX}${actionDescription} e uma acao sensivel. Confirma?`,
  };
}

async function buildGroupCreationSuggestions(userId: string) {
  const [{ friends }, { groups }] = await Promise.all([
    assistantUseCases.listAcceptedFriends.execute(userId),
    assistantUseCases.listGroups.execute(userId),
  ]);

  const friendEmails = friends.slice(0, 5).map((friend) => friend.email);
  const groupNames = (groups as any[]).slice(0, 5).map((group) => group.name);

  const chunks: string[] = [];
  if (friendEmails.length > 0) {
    chunks.push(`amigos: ${friendEmails.join(", ")}`);
  }
  if (groupNames.length > 0) {
    chunks.push(`grupos para copiar membros: ${groupNames.join(", ")}`);
  }

  return chunks.length > 0 ? ` Sugestoes -> ${chunks.join(" | ")}.` : "";
}

function describeGroupHistoryEvent(event: any) {
  const taskTitle = event.taskTitleSnapshot || event.todo?.title || "Tarefa";
  const actorName = event.actor?.name || event.actor?.email || "Usuario";

  if (event.action === "TASK_CREATED") {
    const toName = event.toGroup?.name || event.fromGroup?.name || "Sem grupo";
    return `${actorName} criou "${taskTitle}" em ${toName}`;
  }

  const fromName = event.fromGroup?.name || "Sem grupo";
  if (event.movedOutsideParentName) {
    return `${actorName} moveu "${taskTitle}" de ${fromName} para grupo fora de (${event.movedOutsideParentName})`;
  }

  const toName = event.toGroup?.name || "Sem grupo";
  return `${actorName} moveu "${taskTitle}" de ${fromName} para ${toName}`;
}

type TaskGroupResolution = {
  group: { id: string; name: string } | null;
  error?: ToolResult;
};

async function resolveCreateTaskGroup(
  userId: string,
  args: z.infer<typeof createTaskArgsSchema>,
  runtime: AssistantRuntimeContext,
): Promise<TaskGroupResolution> {
  if (args.withoutGroup || isNoGroupRequest(runtime.rawUserMessage)) {
    return { group: null };
  }

  if (args.groupId || args.groupName) {
    const resolved = await resolveUserGroup(userId, { groupId: args.groupId, groupName: args.groupName });
    if (resolved.ambiguousCandidates?.length) {
      return {
        group: null,
        error: {
          ok: false,
          error: "Encontrei mais de um grupo com esse nome. Informe groupId.",
          candidates: resolved.ambiguousCandidates,
        },
      };
    }
    if (!resolved.group) {
      return { group: null, error: { ok: false, error: "Grupo nao encontrado para este usuario." } };
    }
    return { group: { id: resolved.group.id, name: resolved.group.name } };
  }

  const fallbackGroupId = runtime.sourceGroupId ?? runtime.preferredGroupId;
  if (fallbackGroupId) {
    const fallback = await resolveUserGroup(userId, { groupId: fallbackGroupId });
    if (fallback.group) {
      return { group: { id: fallback.group.id, name: fallback.group.name } };
    }
  }

  const { groups } = await assistantUseCases.listGroups.execute(userId);
  const userGroups = groups as any[];

  if (userGroups.length === 0) {
    return { group: null };
  }
  if (userGroups.length === 1) {
    return { group: { id: userGroups[0].id, name: userGroups[0].name } };
  }

  return {
    group: null,
    error: {
      ok: false,
      error: 'Nao ficou claro em qual grupo criar a tarefa. Informe o grupo ou diga "sem grupo".',
      candidates: userGroups.map((group) => ({ id: group.id, name: group.name })),
    },
  };
}

export function getToolDeclarations(_message: string, _sourceGroupId?: string) {
  // Estrategia simples: sempre expor o catalogo completo e deixar o modelo decidir.
  return Object.values(allToolDeclarations);
}

export async function buildRuntimeContext(params: {
  userId: string;
  message: string;
  sourceGroupId?: string;
  recentUserMessages: string[];
}): Promise<AssistantRuntimeContext> {
  const { groups } = await assistantUseCases.listGroups.execute(params.userId);
  const userGroups = groups as any[];

  const sourceGroup = params.sourceGroupId
    ? userGroups.find((group) => group.id === params.sourceGroupId)
    : null;
  const mentionedInMessage = findMentionedGroup(userGroups, params.message);
  const preferredGroup = sourceGroup ?? mentionedInMessage ?? null;

  return {
    sourceGroupId: params.sourceGroupId,
    preferredGroupId: preferredGroup?.id,
    preferredGroupName: preferredGroup?.name,
    rawUserMessage: params.message,
    recentUserMessages: params.recentUserMessages.slice(-8),
  };
}

export function buildRetryQuestion(failure: ToolFailure): string {
  const errorText = failure.result.error || "Nao consegui concluir essa acao.";
  if (errorText.startsWith(SENSITIVE_CONFIRMATION_PREFIX)) {
    return errorText.replace(SENSITIVE_CONFIRMATION_PREFIX, "").trim();
  }

  if (Array.isArray(failure.result.candidates) && failure.result.candidates.length > 0) {
    const options = failure.result.candidates
      .slice(0, 8)
      .map((candidate) => {
        if (candidate.title) return `${candidate.id} (${candidate.title})`;
        if (candidate.name) return `${candidate.id} (${candidate.name})`;
        return String(candidate.id);
      })
      .join(", ");
    return `${errorText} Opcoes: ${options}.`;
  }

  if (errorText.includes("Nao ficou claro em qual grupo criar a tarefa")) {
    return `${errorText} Informe o nome do grupo ou diga "sem grupo".`;
  }
  if (errorText.includes("Grupo nao encontrado")) {
    return `${errorText} Qual o nome exato do grupo?`;
  }
  if (errorText.includes("Tarefa nao encontrada")) {
    return `${errorText} Me passe o taskId ou o titulo exato.`;
  }
  if (errorText.includes("Informe taskId")) {
    return `${errorText} Se preferir, me passe o titulo completo da tarefa.`;
  }
  if (errorText.includes("O grupo precisa ter pelo menos 2 membros")) {
    return "Para criar o grupo, preciso de pelo menos mais um membro. Pode me passar os emails?";
  }

  return `${errorText} Pode me passar os dados que faltam?`;
}

export async function runTool(
  call: { name: string; args: unknown },
  userId: string,
  actions: AssistantAction[],
  runtime: AssistantRuntimeContext,
): Promise<ToolResult> {
  try {
    if (call.name === "criar_tarefa") {
      const args = createTaskArgsSchema.parse(call.args || {});
      const groupResolution = await resolveCreateTaskGroup(userId, args, runtime);
      if (groupResolution.error) return groupResolution.error;

      const description = args.description?.trim() || inferTaskDescription(args.title, runtime);
      const { todo } = await assistantUseCases.createTodo.execute({
        title: args.title,
        userId,
        description,
        groupId: groupResolution.group?.id,
      });

      const task = toToolTask(todo, groupResolution.group);
      actions.push({ type: "task_created", id: task.id });

      return {
        ok: true,
        task,
        inferredDescription: !args.description,
      };
    }

    if (call.name === "buscar_tarefas") {
      const args = searchTasksArgsSchema.parse(call.args || {});
      const query = normalizeText(args.query ?? "");
      const { todos } = await assistantUseCases.selectTodos.execute({ userId });

      const tasks = todos
        .filter((todo) => {
          if (!args.includeCompleted && todo.completed) return false;
          if (args.groupName && normalizeText(todo.group?.name ?? "") !== normalizeText(args.groupName)) return false;
          if (!query) return true;
          return normalizeText(todo.title).includes(query)
            || normalizeText(todo.description ?? "").includes(query);
        })
        .slice(0, args.limit ?? 10)
        .map((todo) => toToolTask(
          todo,
          todo.group ? { id: todo.group.id, name: todo.group.name } : null,
        ));

      return {
        ok: true,
        query: args.query ?? null,
        count: tasks.length,
        tasks,
      };
    }

    if (call.name === "marcar_concluida") {
      const args = markTaskDoneArgsSchema.parse(call.args || {});
      const todos = await listVisibleTodos(userId);

      const selected = todos.filter((todo) => {
        if (args.taskId && todo.id !== args.taskId) return false;
        if (args.title && !normalizeText(todo.title).includes(normalizeText(args.title))) return false;
        if (args.groupName && normalizeText(todo.group?.name ?? "") !== normalizeText(args.groupName)) return false;
        return true;
      });

      if (selected.length === 0) {
        return { ok: false, error: "Tarefa nao encontrada para marcar como concluida." };
      }
      if (!args.taskId && selected.length > 1) {
        return {
          ok: false,
          error: "Encontrei mais de uma tarefa. Informe taskId.",
          candidates: selected.map(toTaskCandidate),
        };
      }

      const target = selected[0];
      const { todo } = await assistantUseCases.completeTodo.execute({
        todoId: target.id,
        userId,
      });

      actions.push({ type: "task_completed", id: todo.id });

      return {
        ok: true,
        task: toToolTask(todo, target.group ? { id: target.group.id, name: target.group.name } : null),
      };
    }

    if (call.name === "atualizar_tarefa") {
      const args = updateTaskArgsSchema.parse(call.args || {});
      const todos = await listVisibleTodos(userId);

      const selected = todos.filter((todo) => {
        if (args.taskId && todo.id !== args.taskId) return false;
        if (args.titleMatch && !normalizeText(todo.title).includes(normalizeText(args.titleMatch))) return false;
        return true;
      });

      if (selected.length === 0) {
        return { ok: false, error: "Tarefa nao encontrada para atualizar." };
      }
      if (!args.taskId && selected.length > 1) {
        return {
          ok: false,
          error: "Encontrei mais de uma tarefa para atualizar. Informe taskId.",
          candidates: selected.map(toTaskCandidate),
        };
      }

      const target = selected[0];
      const shouldMove = Boolean(args.moveToNoGroup || args.groupNameDestination || args.groupIdDestination);
      let destinationGroup: { id: string; name: string } | null | undefined;

      if (shouldMove) {
        if (args.moveToNoGroup) {
          destinationGroup = null;
        } else {
          const resolvedDestination = await resolveUserGroup(
            userId,
            { groupId: args.groupIdDestination, groupName: args.groupNameDestination },
          );
          if (resolvedDestination.ambiguousCandidates?.length) {
            return {
              ok: false,
              error: "Encontrei mais de um grupo de destino. Informe groupIdDestination.",
              candidates: resolvedDestination.ambiguousCandidates,
            };
          }
          if (!resolvedDestination.group) {
            return { ok: false, error: "Grupo de destino nao encontrado para este usuario." };
          }
          destinationGroup = { id: resolvedDestination.group.id, name: resolvedDestination.group.name };
        }
      }

      const payload: {
        todoId: number;
        userId: string;
        title?: string;
        groupId?: string | null;
      } = {
        todoId: target.id,
        userId,
      };

      if (args.newTitle) payload.title = args.newTitle;
      if (shouldMove) payload.groupId = destinationGroup?.id ?? null;

      const { todo } = await assistantUseCases.updateTodo.execute(payload);
      const resultingGroup = shouldMove
        ? (destinationGroup ?? null)
        : (target.group ? { id: target.group.id, name: target.group.name } : null);

      actions.push(shouldMove
        ? { type: "task_moved", id: todo.id, groupId: resultingGroup?.id ?? null }
        : { type: "task_updated", id: todo.id });

      return {
        ok: true,
        task: toToolTask(todo, resultingGroup),
      };
    }

    if (call.name === "mover_para_grupo") {
      const args = moveTaskArgsSchema.parse(call.args || {});
      const parity = parseParity(args.numberParity);
      const taskIdsSet = new Set<number>(args.taskIds ?? []);
      let destinationGroup: { id: string; name: string } | null = null;
      let destinationGroupId: string | null = null;

      if (!args.moveToNoGroup) {
        const resolved = await resolveUserGroup(
          userId,
          { groupId: args.groupIdDestination, groupName: args.groupNameDestination },
        );
        if (resolved.ambiguousCandidates?.length) {
          return {
            ok: false,
            error: "Encontrei mais de um grupo de destino. Informe groupIdDestination.",
            candidates: resolved.ambiguousCandidates,
          };
        }
        if (!resolved.group) {
          return { ok: false, error: "Grupo de destino nao encontrado para este usuario." };
        }
        destinationGroupId = resolved.group.id;
        destinationGroup = { id: resolved.group.id, name: resolved.group.name };
      }

      const todos = await listVisibleTodos(userId);
      const candidates = todos.filter((todo) => {
        if (args.taskId && todo.id !== args.taskId) return false;
        if (taskIdsSet.size > 0 && !taskIdsSet.has(todo.id)) return false;
        if (args.title && !normalizeText(todo.title).includes(normalizeText(args.title))) return false;
        if (parity) {
          const titleNumber = extractTaskNumberFromTitle(todo.title);
          if (titleNumber === null) return false;
          if (parity === "even" && titleNumber % 2 !== 0) return false;
          if (parity === "odd" && titleNumber % 2 === 0) return false;
        }
        if (args.fromGroupName && normalizeText(todo.group?.name ?? "") !== normalizeText(args.fromGroupName)) {
          return false;
        }
        return true;
      });

      if (candidates.length === 0) {
        return { ok: false, error: "Tarefa nao encontrada para mover." };
      }

      const isBatchMove = Boolean(args.moveAllMatches || parity || taskIdsSet.size > 0);
      if (!isBatchMove && !args.taskId && args.title && candidates.length > 1) {
        return {
          ok: false,
          error: "Encontrei mais de uma tarefa com esse titulo. Informe taskId.",
          candidates: candidates.map(toTaskCandidate),
        };
      }

      const selectedTodos = isBatchMove ? candidates : [candidates[0]];
      const movedTasks: Array<ReturnType<typeof toToolTask>> = [];
      const skippedTasks: number[] = [];
      const failedTasks: Array<{ id: number; error: string }> = [];

      for (const selected of selectedTodos) {
        if ((selected.group?.id ?? null) === destinationGroupId) {
          skippedTasks.push(selected.id);
          continue;
        }

        try {
          const { todo } = await assistantUseCases.updateTodo.execute({
            todoId: selected.id,
            userId,
            groupId: destinationGroupId,
          });

          movedTasks.push(toToolTask(todo, destinationGroup));
          actions.push({ type: "task_moved", id: todo.id, groupId: destinationGroupId });
        } catch (err: any) {
          failedTasks.push({
            id: selected.id,
            error: err?.message || "Falha ao mover tarefa.",
          });
        }
      }

      if (movedTasks.length === 0) {
        if (!isBatchMove && skippedTasks.length > 0) {
          return { ok: false, error: "A tarefa ja esta no destino informado." };
        }
        if (failedTasks.length > 0) {
          return {
            ok: false,
            error: `Nao consegui mover nenhuma tarefa. Falhas: ${failedTasks.map((item) => item.id).join(", ")}`,
          };
        }
        return { ok: false, error: "Nenhuma tarefa elegivel para mover." };
      }

      if (!isBatchMove) {
        return {
          ok: true,
          task: movedTasks[0],
          skippedTasks,
          failedTasks,
        };
      }

      return {
        ok: true,
        movedCount: movedTasks.length,
        tasks: movedTasks,
        skippedTasks,
        failedTasks,
      };
    }

    if (call.name === "deletar_tarefa") {
      const args = deleteTaskArgsSchema.parse(call.args || {});
      if (!args.confirm) {
        return buildSensitiveConfirmationError("Deletar tarefa");
      }

      const todos = await listVisibleTodos(userId);
      const selected = todos.filter((todo) => {
        if (args.taskId && todo.id !== args.taskId) return false;
        if (args.title && !normalizeText(todo.title).includes(normalizeText(args.title))) return false;
        if (args.groupName && normalizeText(todo.group?.name ?? "") !== normalizeText(args.groupName)) return false;
        return true;
      });

      if (selected.length === 0) {
        return { ok: false, error: "Tarefa nao encontrada para deletar." };
      }
      if (!args.taskId && selected.length > 1) {
        return {
          ok: false,
          error: "Encontrei mais de uma tarefa para deletar. Informe taskId.",
          candidates: selected.map(toTaskCandidate),
        };
      }

      const target = selected[0];
      await assistantUseCases.deleteTodo.execute({ todoId: target.id, userId });
      actions.push({ type: "task_deleted", id: target.id });

      return {
        ok: true,
        taskId: target.id,
        deleted: true,
      };
    }

    if (call.name === "criar_grupo") {
      const args = createGroupArgsSchema.parse(call.args || {});
      if (!args.name?.trim()) {
        return { ok: false, error: "Informe o nome do grupo para criar." };
      }

      const normalizedEmails = new Set<string>();
      let copiedFromGroup: { id: string; name: string } | null = null;

      for (const email of args.userEmails ?? []) {
        normalizedEmails.add(normalizeEmail(email));
      }

      const sourceGroupName = args.copyMembersFromGroupName ?? args.fromGroupName;
      const sourceGroupId = args.copyMembersFromGroupId ?? args.fromGroupId;
      if (sourceGroupName || sourceGroupId) {
        const sourceGroup = await resolveUserGroup(
          userId,
          { groupId: sourceGroupId, groupName: sourceGroupName },
          runtime.sourceGroupId,
        );

        if (sourceGroup.ambiguousCandidates?.length) {
          return {
            ok: false,
            error: "Encontrei mais de um grupo para copiar membros. Informe groupId.",
            candidates: sourceGroup.ambiguousCandidates,
          };
        }

        if (!sourceGroup.group) {
          return { ok: false, error: "Grupo de origem nao encontrado para este usuario." };
        }

        copiedFromGroup = { id: sourceGroup.group.id, name: sourceGroup.group.name };

        for (const member of sourceGroup.group.members ?? []) {
          const email = member?.user?.email;
          if (typeof email === "string" && email.includes("@")) {
            normalizedEmails.add(normalizeEmail(email));
          }
        }
      }

      if (args.includeAcceptedFriends) {
        const { friends } = await assistantUseCases.listAcceptedFriends.execute(userId);
        for (const friend of friends) {
          normalizedEmails.add(normalizeEmail(friend.email));
        }
      }

      const providedAnySource = normalizedEmails.size > 0 || Boolean(sourceGroupName || sourceGroupId || args.includeAcceptedFriends);
      if (!providedAnySource || normalizedEmails.size === 0) {
        const suggestions = await buildGroupCreationSuggestions(userId);
        return {
          ok: false,
          error: `Para criar o grupo, preciso dos membros (emails, copia de outro grupo ou amigos aceitos).${suggestions}`,
        };
      }

      const group = await assistantUseCases.createGroup.execute({
        name: args.name.trim(),
        description: args.description,
        userEmails: Array.from(normalizedEmails),
        creatorUserId: userId,
      });

      actions.push({ type: "group_created", id: group.id });

      return {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
        },
        memberCount: group.members?.length ?? null,
        copiedFromGroup,
      };
    }

    if (call.name === "listar_grupos") {
      listGroupsArgsSchema.parse(call.args || {});
      const { groups } = await assistantUseCases.listGroups.execute(userId);

      return {
        ok: true,
        count: groups.length,
        groups: (groups as any[]).map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: group.members?.length ?? 0,
        })),
      };
    }

    if (call.name === "atualizar_grupo") {
      const args = updateGroupArgsSchema.parse(call.args || {});
      const resolvedGroup = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (resolvedGroup.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo para atualizar. Informe groupId.",
          candidates: resolvedGroup.ambiguousCandidates,
        };
      }
      if (!resolvedGroup.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      if ((args.removeUserIds?.length ?? 0) > 0 && !args.confirm) {
        return buildSensitiveConfirmationError("Remover membros do grupo");
      }

      const relatedGroupIds = new Set<string>(args.relatedGroupIds ?? []);
      for (const relatedName of args.relatedGroupNames ?? []) {
        const relatedResolved = await resolveUserGroup(userId, { groupName: relatedName });
        if (relatedResolved.ambiguousCandidates?.length) {
          return {
            ok: false,
            error: `Encontrei mais de um grupo relacionado para "${relatedName}". Informe IDs.`,
            candidates: relatedResolved.ambiguousCandidates,
          };
        }
        if (!relatedResolved.group) {
          return { ok: false, error: `Grupo relacionado "${relatedName}" nao encontrado.` };
        }
        relatedGroupIds.add(relatedResolved.group.id);
      }

      const shouldSetRelatedGroups = args.relatedGroupIds !== undefined || args.relatedGroupNames !== undefined;
      const { group } = await assistantUseCases.updateGroup.execute({
        groupId: resolvedGroup.group.id,
        userId,
        name: args.name,
        description: args.description,
        addUserEmails: args.addUserEmails,
        removeUserIds: args.removeUserIds,
        relatedGroupIds: shouldSetRelatedGroups ? Array.from(relatedGroupIds) : undefined,
      });

      actions.push({ type: "group_updated", id: group.id });

      return {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: group.members?.length ?? 0,
          relatedGroupIds: (group.childGroups ?? []).map((child) => child.id),
        },
      };
    }

    if (call.name === "deletar_grupo") {
      const args = deleteGroupArgsSchema.parse(call.args || {});
      if (!args.confirm) {
        return buildSensitiveConfirmationError("Deletar grupo");
      }

      const resolvedGroup = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (resolvedGroup.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo para deletar. Informe groupId.",
          candidates: resolvedGroup.ambiguousCandidates,
        };
      }
      if (!resolvedGroup.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const deleted = await assistantUseCases.deleteGroup.execute({
        id: resolvedGroup.group.id,
        requesterUserId: userId,
      });

      actions.push({ type: "group_deleted", id: deleted.id });

      return {
        ok: true,
        group: {
          id: deleted.id,
          name: deleted.name,
        },
      };
    }

    if (call.name === "sair_do_grupo") {
      const args = leaveGroupArgsSchema.parse(call.args || {});
      if (!args.confirm) {
        return buildSensitiveConfirmationError("Sair do grupo");
      }

      const resolvedGroup = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (resolvedGroup.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo para sair. Informe groupId.",
          candidates: resolvedGroup.ambiguousCandidates,
        };
      }
      if (!resolvedGroup.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const result = await assistantUseCases.leaveGroup.execute({
        groupId: resolvedGroup.group.id,
        userId,
      });

      actions.push({ type: "group_left", id: resolvedGroup.group.id });

      return {
        ok: true,
        group: {
          id: resolvedGroup.group.id,
          name: resolvedGroup.group.name,
        },
        message: result.message,
      };
    }

    if (call.name === "list_group_members") {
      const args = listGroupMembersArgsSchema.parse(call.args || {});
      const groupResolution = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (groupResolution.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo. Informe groupId.",
          candidates: groupResolution.ambiguousCandidates,
        };
      }
      if (!groupResolution.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const members = (groupResolution.group.members ?? [])
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
          id: groupResolution.group.id,
          name: groupResolution.group.name,
        },
        count: members.length,
        members,
      };
    }

    if (call.name === "list_group_history") {
      const args = listGroupHistoryArgsSchema.parse(call.args || {});
      const groupResolution = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (groupResolution.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo. Informe groupId.",
          candidates: groupResolution.ambiguousCandidates,
        };
      }
      if (!groupResolution.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const { history } = await assistantUseCases.listGroupHistory.execute({
        groupId: groupResolution.group.id,
        userId,
        limit: args.limit,
      });

      return {
        ok: true,
        group: {
          id: groupResolution.group.id,
          name: groupResolution.group.name,
        },
        history: history.map((event) => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
          description: describeGroupHistoryEvent(event),
        })),
      };
    }

    if (call.name === "list_group_messages") {
      const args = listGroupMessagesArgsSchema.parse(call.args || {});
      const groupResolution = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (groupResolution.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo. Informe groupId.",
          candidates: groupResolution.ambiguousCandidates,
        };
      }
      if (!groupResolution.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const { messages } = await assistantUseCases.listGroupMessages.execute(groupResolution.group.id);
      const limited = messages.slice(-(args.limit ?? 20));

      return {
        ok: true,
        group: {
          id: groupResolution.group.id,
          name: groupResolution.group.name,
        },
        count: limited.length,
        messages: limited.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          authorId: message.authorId,
          authorName: message.authorName ?? null,
          kind: message.kind,
        })),
      };
    }

    if (call.name === "listar_amigos") {
      listFriendsArgsSchema.parse(call.args || {});
      const { friends } = await assistantUseCases.listAcceptedFriends.execute(userId);

      const sorted = friends
        .map((friend) => ({
          id: friend.id,
          name: friend.name,
          email: friend.email,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ok: true,
        count: sorted.length,
        friends: sorted,
      };
    }

    if (call.name === "avisar_no_grupo") {
      const args = postGroupNoticeArgsSchema.parse(call.args || {});
      const groupResolution = await resolveUserGroup(
        userId,
        { groupId: args.groupId, groupName: args.groupName },
        runtime.sourceGroupId,
      );

      if (groupResolution.ambiguousCandidates?.length) {
        return {
          ok: false,
          error: "Encontrei mais de um grupo. Informe groupId.",
          candidates: groupResolution.ambiguousCandidates,
        };
      }
      if (!groupResolution.group) {
        return { ok: false, error: "Grupo nao encontrado para este usuario." };
      }

      const { message } = await assistantUseCases.createGroupMessage.execute({
        groupId: groupResolution.group.id,
        authorId: userId,
        content: normalizeElisaContent(args.content),
      });

      actions.push({
        type: "group_message_sent",
        id: message.id,
        groupId: groupResolution.group.id,
      });

      return {
        ok: true,
        group: { id: groupResolution.group.id, name: groupResolution.group.name },
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
    }

    if (call.name === "listar_mensagens_tarefa") {
      const args = listTodoMessagesArgsSchema.parse(call.args || {});
      await ensureTodoVisible(userId, args.taskId);
      const { messages } = await assistantUseCases.listTodoMessages.execute(args.taskId, args.kind ?? "COMMENT");

      return {
        ok: true,
        taskId: args.taskId,
        kind: args.kind ?? "COMMENT",
        count: messages.length,
        messages: messages.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          authorId: message.authorId,
          authorName: message.authorName ?? null,
          kind: message.kind,
        })),
      };
    }

    if (call.name === "comentar_tarefa") {
      const args = createTodoMessageArgsSchema.parse(call.args || {});
      await ensureTodoVisible(userId, args.taskId);
      const { message } = await assistantUseCases.createTodoMessage.execute({
        todoId: args.taskId,
        authorId: userId,
        content: args.content,
        kind: args.kind ?? "COMMENT",
      });

      actions.push({
        type: "todo_message_created",
        id: message.id,
        todoId: args.taskId,
      });

      return {
        ok: true,
        taskId: args.taskId,
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          authorId: message.authorId,
          authorName: message.authorName ?? null,
          kind: message.kind,
        },
      };
    }

    if (call.name === "editar_comentario_tarefa") {
      const args = updateTodoMessageArgsSchema.parse(call.args || {});
      const { message } = await assistantUseCases.updateTodoMessage.execute({
        commentId: args.commentId,
        authorId: userId,
        content: args.content,
      });

      actions.push({
        type: "todo_message_updated",
        id: message.id,
        todoId: args.taskId,
      });

      return {
        ok: true,
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          authorId: message.authorId,
          authorName: message.authorName ?? null,
          kind: message.kind,
        },
      };
    }

    if (call.name === "deletar_comentario_tarefa") {
      const args = deleteTodoMessageArgsSchema.parse(call.args || {});
      if (!args.confirm) {
        return buildSensitiveConfirmationError("Deletar comentario");
      }

      await assistantUseCases.deleteTodoMessage.execute({
        commentId: args.commentId,
        authorId: userId,
      });

      actions.push({
        type: "todo_message_deleted",
        id: args.commentId,
        todoId: args.taskId,
      });

      return {
        ok: true,
        deleted: true,
        commentId: args.commentId,
      };
    }

    return { ok: false, error: "Ferramenta desconhecida." };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Falha ao executar ferramenta.",
      ...(Array.isArray(err?.candidates) ? { candidates: err.candidates } : {}),
    };
  }
}
