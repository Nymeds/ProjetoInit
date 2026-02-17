import api, { toApiError } from "./api";

export interface GroupUser {
  id: string;
  name: string;
  email: string;
}

export interface TodoImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed?: boolean;
  createdAt: string;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
  images?: TodoImage[];
}

export interface CreateTodoData {
  title: string;
  description?: string;
  groupId?: string;
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

function normalizeTodoId(id: string | number): string {
  return normalizeRequiredText(String(id), "ID da tarefa");
}

export async function getTodos(): Promise<{ todos: Todo[] }> {
  try {
    const response = await api.get<{ todos?: Todo[] }>("/todo");
    return { todos: response.data.todos ?? [] };
  } catch (error) {
    throw toApiError(error, "Erro ao buscar tarefas");
  }
}

export async function createTodo(data: CreateTodoData): Promise<TodoResponse> {
  const title = normalizeRequiredText(data.title, "Titulo da tarefa");
  const description = normalizeOptionalText(data.description);
  const groupId = normalizeOptionalText(data.groupId);

  try {
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

export async function deleteTodo(id: string | number): Promise<DeleteTodoResponse> {
  const todoId = normalizeTodoId(id);

  try {
    const response = await api.delete<DeleteTodoResponse>(`/todo/${encodeURIComponent(todoId)}`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao deletar tarefa");
  }
}

export async function completeTodo(id: string | number): Promise<TodoResponse> {
  const todoId = normalizeTodoId(id);

  try {
    const response = await api.patch<TodoResponse>(`/todo/${encodeURIComponent(todoId)}/complete`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar tarefa");
  }
}
