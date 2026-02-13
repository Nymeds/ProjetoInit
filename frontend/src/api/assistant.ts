import { api, toApiError } from "./auth";

export type AssistantRole = "USER" | "ASSISTANT" | "TOOL";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
}

export type AssistantAction =
  | { type: "task_created"; id: number }
  | { type: "group_created"; id: string };

export interface AssistantHistoryResponse {
  threadId: string | null;
  messages: AssistantMessage[];
}

export interface AssistantChatResponse {
  userMessage: AssistantMessage;
  message: AssistantMessage;
  actions: AssistantAction[];
  reply: string;
}

function normalizePrompt(message: string): string {
  const normalized = message.trim();
  if (!normalized) {
    throw new Error("Mensagem obrigatoria");
  }

  return normalized;
}

// Historico persistido da conversa da ELISA para o usuario logado.
export async function getAssistantHistory(): Promise<AssistantHistoryResponse> {
  try {
    const response = await api.get<AssistantHistoryResponse>("/assistant/history");
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao carregar historico da ELISA");
  }
}

// Envia pergunta para a ELISA e retorna resposta + acoes executadas.
export async function sendAssistantMessage(message: string): Promise<AssistantChatResponse> {
  const normalizedMessage = normalizePrompt(message);

  try {
    const response = await api.post<AssistantChatResponse>("/assistant/chat", {
      message: normalizedMessage,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao enviar mensagem para a ELISA");
  }
}
