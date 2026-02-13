import { api, toApiError } from "./auth";
import type { Todo } from "../types/types";

export interface CreateTodoData {
  title: string;
  description?: string;
  groupId?: string;
  imageFile?: File | null;
}

export interface TodoResponse {
  todo: Todo;
}

export interface DeleteTodoResponse {
  message: string;
}

function normalizeRequiredText(value: string, fieldLabel: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} e obrigatorio`);
  }

  return normalized;
}

function normalizeOptionalText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTodoId(id: string): string {
  return normalizeRequiredText(id, "ID da tarefa");
}

// Cria tarefa com payload JSON ou multipart quando houver imagem.
export async function createTodo(data: CreateTodoData): Promise<TodoResponse> {
  const title = normalizeRequiredText(data.title, "Titulo da tarefa");
  const description = normalizeOptionalText(data.description);
  const groupId = normalizeOptionalText(data.groupId);
  const hasImage = Boolean(data.imageFile);

  try {
    if (hasImage) {
      const formData = new FormData();
      formData.append("title", title);

      if (description) {
        formData.append("description", description);
      }

      if (groupId) {
        formData.append("groupId", groupId);
      }

      if (data.imageFile) {
        formData.append("image", data.imageFile);
      }

      const response = await api.post<TodoResponse>("/todo", formData);
      return response.data;
    }

    const response = await api.post<TodoResponse>("/todo", {
      title,
      description,
      groupId,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao criar tarefa");
  }
}

// Move a tarefa de grupo reutilizando o endpoint de update.
export async function moveTodo(id: string, groupId: string | null, title: string): Promise<TodoResponse> {
  const todoId = normalizeTodoId(id);
  const normalizedTitle = normalizeRequiredText(title, "Titulo da tarefa");
  const normalizedGroupId = normalizeOptionalText(groupId) ?? null;

  try {
    const response = await api.put<TodoResponse>(`/todo/${encodeURIComponent(todoId)}`, {
      title: normalizedTitle,
      groupId: normalizedGroupId,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao mover tarefa");
  }
}

export async function deleteTodo(id: string): Promise<DeleteTodoResponse> {
  const todoId = normalizeTodoId(id);

  try {
    const response = await api.delete<DeleteTodoResponse>(`/todo/${encodeURIComponent(todoId)}`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao deletar tarefa");
  }
}

// Mantido como updateTodo para preservar contrato atual do frontend.
export async function updateTodo(id: string): Promise<TodoResponse> {
  const todoId = normalizeTodoId(id);

  try {
    const response = await api.patch<TodoResponse>(`/todo/${encodeURIComponent(todoId)}/complete`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar tarefa");
  }
}
