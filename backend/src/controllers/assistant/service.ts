import { env } from "../../env/index.js";
import { prisma } from "../../utils/prismaClient.js";
import { aiClient } from "./client.js";
import {
  ELISA_STATE_PREFIX,
  GREETING_PATTERN,
  MAX_CONTEXT_MESSAGES,
  MAX_TEXT_PER_MESSAGE,
  MAX_THREAD_CONTEXT_CHARS,
  MAX_TOOL_ROUNDS,
  MODEL_NAME,
  SYSTEM_INSTRUCTION,
} from "./config.js";
import { compactText } from "./helpers.js";
import { buildRetryQuestion, buildRuntimeContext, getToolDeclarations, runTool } from "./tools.js";
import type {
  AssistantAction,
  AssistantConversationState,
  AssistantProcessParams,
  ToolFailure,
} from "./types.js";
import { assistantUseCases } from "./use-cases.js";

/**
 * Erro especializado para o loop de ferramentas.
 * Em vez de perder contexto numa excecao generica, carregamos junto o resultado
 * da ferramenta que falhou para transformar a falha em uma pergunta util.
 */
class ToolExecutionFailed extends Error {
  failure: ToolFailure;

  constructor(failure: ToolFailure) {
    super(failure.result.error || "Falha ao executar ferramenta.");
    this.name = "ToolExecutionFailed";
    this.failure = failure;
  }
}

/**
 * Extrai apenas o texto livre da resposta do provedor.
 * A API pode retornar texto, chamadas de funcao ou ambos; aqui ignoramos tudo
 * que nao for texto puro para montar a resposta final ao usuario.
 */
function extractTextFromResponse(response: any): string | undefined {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  const text = parts
    .filter((part: any) => typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("");

  return text || undefined;
}

/**
 * Recupera ou cria a thread persistente da ELISA para o usuario atual.
 * Essa thread e a memoria "longa" da conversa no chat privado.
 */
async function getOrCreateThread(userId: string) {
  return prisma.assistantThread.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/**
 * Traduz o enum interno do banco para o papel esperado pelo modelo.
 */
function toModelRole(role: "USER" | "ASSISTANT") {
  return role === "USER" ? "user" : "model";
}

/**
 * Compacta o historico salvo no banco para o formato aceito pelo modelo,
 * respeitando limites de quantidade e de caracteres.
 */
function buildThreadContents(history: Array<{ role: "USER" | "ASSISTANT"; content: string }>) {
  const selectedHistory = history.slice(-MAX_CONTEXT_MESSAGES);
  const compacted: Array<{ role: "USER" | "ASSISTANT"; content: string }> = [];
  let usedChars = 0;

  for (let index = selectedHistory.length - 1; index >= 0; index -= 1) {
    const item = selectedHistory[index];
    const remainingChars = MAX_THREAD_CONTEXT_CHARS - usedChars;
    if (remainingChars <= 32) break;

    const content = compactText(item.content, Math.min(MAX_TEXT_PER_MESSAGE, remainingChars));
    usedChars += content.length;
    compacted.push({ role: item.role, content });
  }

  return compacted.reverse().map((item) => ({
    role: toModelRole(item.role),
    parts: [{ text: item.content }],
  }));
}

/**
 * Remove sinais tecnicos dos argumentos antes de salvar um estado interno.
 * Exemplo: um `confirm: false` nao precisa ser perpetuado na memoria.
 */
function sanitizeStoredArgs(args: unknown) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return undefined;

  const sanitized = { ...(args as Record<string, unknown>) };
  if (sanitized.confirm === false) {
    delete sanitized.confirm;
  }

  return sanitized;
}

/**
 * Serializa o estado interno da conversa usando um prefixo reservado.
 * Esse prefixo permite distinguir memoria tecnica de mensagens humanas.
 */
function encodeAssistantState(state: AssistantConversationState) {
  return `${ELISA_STATE_PREFIX}${JSON.stringify(state)}`;
}

/**
 * Faz o processo inverso de `encodeAssistantState`.
 * Se o conteudo nao for um estado valido, retorna `null` sem derrubar o fluxo.
 */
function parseAssistantState(content?: string | null): AssistantConversationState | null {
  if (!content || !content.startsWith(ELISA_STATE_PREFIX)) return null;

  try {
    const parsed = JSON.parse(content.slice(ELISA_STATE_PREFIX.length));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as AssistantConversationState;
  } catch {
    return null;
  }
}

/**
 * Busca a memoria interna mais recente da thread.
 * Hoje essa memoria guarda principalmente pendencias de confirmacao e follow-up.
 */
async function loadLatestAssistantState(threadId?: string | null) {
  if (!threadId) return null;

  const stateMessage = await prisma.assistantMessage.findFirst({
    where: {
      threadId,
      role: "TOOL",
      content: { startsWith: ELISA_STATE_PREFIX },
    },
    orderBy: { createdAt: "desc" },
  });

  return parseAssistantState(stateMessage?.content);
}

/**
 * Persiste um snapshot tecnico do estado da conversa.
 * Esse registro nao aparece no historico do front, mas ajuda a ELISA a entender
 * respostas curtas como "sim" ou "nao".
 */
async function persistAssistantState(threadId: string, state: AssistantConversationState) {
  await prisma.assistantMessage.create({
    data: {
      threadId,
      role: "TOOL",
      content: encodeAssistantState(state),
    },
  });
}

/**
 * Enriquecimento final do prompt de sistema com contexto operacional sintetico.
 * O prompt base continua fixo, mas cada rodada pode receber um resumo diferente.
 */
function buildSystemInstruction(runtime: { contextSummary?: string }) {
  if (!runtime.contextSummary) {
    return SYSTEM_INSTRUCTION;
  }

  return `${SYSTEM_INSTRUCTION.trim()}\nContexto operacional desta rodada:\n- ${runtime.contextSummary}`;
}

/**
 * Monta o estado interno que sera salvo apos a resposta da ELISA.
 * Quando houve falha/ambiguidade, salvamos a pendencia; quando nao houve, a
 * conversa volta ao estado "idle".
 */
function buildAssistantState(params: {
  failure?: ToolFailure;
  reply: string;
  previousUserMessage: string;
  sourceGroupId?: string;
}): AssistantConversationState {
  if (!params.failure) {
    return {
      status: "idle",
      createdAt: new Date().toISOString(),
      sourceGroupId: params.sourceGroupId,
    };
  }

  const errorText = params.failure.result.error || "";
  const kind = errorText.startsWith("CONFIRM_REQUIRED|") ? "confirmation" : "clarification";

  return {
    status: "pending",
    kind,
    toolNames: [params.failure.tool],
    assistantPrompt: params.reply,
    previousUserMessage: params.previousUserMessage,
    args: sanitizeStoredArgs(params.failure.args),
    candidates: params.failure.result.candidates?.slice(0, 6),
    sourceGroupId: params.sourceGroupId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Remove a mencao "elisa" da frase original quando o usuario fala com a
 * assistente dentro de um grupo.
 */
function sanitizeMentionPrompt(message: string) {
  return message.replace(/\belisa\b[:,\-]?\s*/i, "").trim() || message.trim();
}

/**
 * Detecta um cumprimento simples para responder rapido, sem custo de modelo.
 */
function isGreetingOnlyToElisa(message: string) {
  return GREETING_PATTERN.test(sanitizeMentionPrompt(message));
}

/**
 * Resposta padrao para saudacoes simples no chat de grupo.
 */
function createGreetingReply() {
  return "ELISA: Oi! Estou por aqui. Me diga o que voce precisa.";
}

/**
 * Garante padronizacao visual das mensagens publicadas pela assistente em grupo.
 */
function normalizeElisaContent(content: string) {
  const trimmed = content.trim();
  return /^elisa:/i.test(trimmed) ? trimmed : `ELISA: ${trimmed}`;
}

/**
 * Publica uma mensagem da ELISA em um grupo e, se houver socket.io, emite o
 * evento em tempo real para atualizar os clientes conectados.
 */
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

/**
 * Placeholder para uma futura memoria resumida de grupos.
 * Hoje existe como ponto de extensao para nao espalhar essa responsabilidade.
 */
export async function maybeStoreGroupSummaryMemory(_params: {
  groupId: string;
}) {
  return;
}

/**
 * Placeholder para comportamento proativo da ELISA em grupos.
 * A ideia e analisar mensagens humanas e sugerir/automatizar acoes de tarefa.
 */
export async function maybePromptTaskActionInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return;
}

/**
 * Placeholder para tratar confirmacoes feitas em grupo apos uma pergunta da ELISA.
 */
export async function maybeHandleTaskConfirmationInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return false;
}

/**
 * Placeholder para continuar um fluxo pendente em grupo sem precisar reiniciar
 * toda a interpretacao da conversa.
 */
export async function maybeHandleAssistantFollowUpInGroup(_params: {
  groupId: string;
  userId: string;
  content: string;
  io?: any;
}) {
  return false;
}

/**
 * Pipeline principal da ELISA.
 * Ele valida acesso, carrega historico, monta contexto, chama o modelo, executa
 * ferramentas, persiste resposta/memoria e opcionalmente publica no grupo.
 */
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
  const latestAssistantState = (!skipThreadHistory && thread?.id)
    ? await loadLatestAssistantState(thread.id)
    : null;

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
      parts: [{ text: compactText(message, MAX_TEXT_PER_MESSAGE) }],
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
    assistantState: latestAssistantState,
  });
  const toolDeclarations = runtime.followUpHint?.includes("Nao execute a acao")
    ? []
    : getToolDeclarations({
      message,
      sourceGroupId,
      preferredToolNames: runtime.suggestedToolNames,
    });
  const systemInstruction = buildSystemInstruction(runtime);
  const modelConfig = {
    systemInstruction,
    ...(toolDeclarations.length > 0
      ? { tools: [{ functionDeclarations: toolDeclarations }] }
      : {}),
    temperature: 0.2,
  };

  let currentResponse: any = await aiClient.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: modelConfig,
  });

  let finalText: string | undefined = extractTextFromResponse(currentResponse);
  const actions: AssistantAction[] = [];
  const toolFailures: Array<{ tool: string; error: string; errorId?: string }> = [];
  let lastToolFailure: ToolFailure | undefined;

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
        lastToolFailure = err.failure;
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
      config: modelConfig,
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

    await persistAssistantState(thread.id, buildAssistantState({
      failure: lastToolFailure,
      reply: safeText,
      previousUserMessage: message,
      sourceGroupId,
    }));
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

/**
 * Entrada especializada para quando a ELISA e mencionada dentro de um chat de grupo.
 * Esse fluxo pula historico privado, trata saudacao simples e publica a resposta
 * automaticamente no grupo de origem.
 */
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
