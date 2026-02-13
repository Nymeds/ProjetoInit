import { api, toApiError } from "./auth";

export type MessageKind = "COMMENT" | "CHAT" | "GROUP";

export interface MessageResponseData {
  id: string;
  content: string;
  createdAt: string;
  kind: MessageKind;
  authorId: string;
  authorName?: string | null;
  groupId?: string | null;
  todoId?: number | null;
}

export interface MessageListResponse {
  messages: MessageResponseData[];
}

export interface MessageMutationResponse {
  message: MessageResponseData;
}

function normalizeRequiredText(value: string, fieldLabel: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} e obrigatorio`);
  }

  return normalized;
}

function normalizePositiveNumber(value: number, fieldLabel: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldLabel} invalido`);
  }

  return value;
}

function normalizeMessageContent(content: string): string {
  return normalizeRequiredText(content, "Conteudo da mensagem");
}

export async function getGroupMessages(groupId: string): Promise<MessageListResponse> {
  const normalizedGroupId = normalizeRequiredText(groupId, "ID do grupo");

  try {
    const response = await api.get<MessageListResponse>(
      `/groups/${encodeURIComponent(normalizedGroupId)}/messages`,
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao buscar mensagens do grupo");
  }
}

export async function postGroupMessage(
  groupId: string,
  content: string,
): Promise<MessageMutationResponse> {
  const normalizedGroupId = normalizeRequiredText(groupId, "ID do grupo");
  const normalizedContent = normalizeMessageContent(content);

  try {
    const response = await api.post<MessageMutationResponse>(
      `/groups/${encodeURIComponent(normalizedGroupId)}/messages`,
      { content: normalizedContent },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao enviar mensagem para o grupo");
  }
}

export async function getTodoComments(todoId: number): Promise<MessageListResponse> {
  const normalizedTodoId = normalizePositiveNumber(todoId, "ID da tarefa");

  try {
    const response = await api.get<MessageListResponse>(`/todo/${normalizedTodoId}/comments`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao buscar comentarios da tarefa");
  }
}

export async function postTodoComment(
  todoId: number,
  content: string,
): Promise<MessageMutationResponse> {
  const normalizedTodoId = normalizePositiveNumber(todoId, "ID da tarefa");
  const normalizedContent = normalizeMessageContent(content);

  try {
    const response = await api.post<MessageMutationResponse>(`/todo/${normalizedTodoId}/comments`, {
      content: normalizedContent,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao criar comentario na tarefa");
  }
}

export async function updateTodoComment(
  todoId: number,
  commentId: string,
  content: string,
): Promise<MessageMutationResponse> {
  const normalizedTodoId = normalizePositiveNumber(todoId, "ID da tarefa");
  const normalizedCommentId = normalizeRequiredText(commentId, "ID do comentario");
  const normalizedContent = normalizeMessageContent(content);

  try {
    const response = await api.put<MessageMutationResponse>(
      `/todo/${normalizedTodoId}/comments/${encodeURIComponent(normalizedCommentId)}`,
      { content: normalizedContent },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar comentario");
  }
}

export async function deleteTodoComment(todoId: number, commentId: string): Promise<void> {
  const normalizedTodoId = normalizePositiveNumber(todoId, "ID da tarefa");
  const normalizedCommentId = normalizeRequiredText(commentId, "ID do comentario");

  try {
    await api.delete(`/todo/${normalizedTodoId}/comments/${encodeURIComponent(normalizedCommentId)}`);
  } catch (error) {
    throw toApiError(error, "Erro ao deletar comentario");
  }
}
