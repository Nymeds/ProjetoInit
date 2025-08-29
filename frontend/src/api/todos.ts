export interface CreateTodoData {
  title: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE = (import.meta.env as any).VITE_API_URL || 'http://localhost:3333';

export async function createTodo(data: CreateTodoData) {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('@app:token') ||
    localStorage.getItem('@ignite:token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    '';

  const payload: Record<string, unknown> = { title: data.title };
  if (data.description) payload.description = data.description;

  const url = `${BASE}/todo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Erro ao criar tarefa: ${res.status}`);
  }

  return res.json();
}

export async function deleteTodo(id: string) {
  if (!id) throw new Error('ID da tarefa é obrigatório');

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('@app:token') ||
    localStorage.getItem('@ignite:token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    '';

  if (!token) {
    throw new Error('Token JWT não encontrado. Faça login novamente.');
  }

  const url = `${BASE}/todo/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error('Não autorizado (401). Verifique o token JWT.');
  }

  if (res.status === 404) {
    const text = await res.text().catch(() => null);
    throw new Error(`Tarefa não encontrada (404). Resposta: ${text || 'sem corpo'}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Erro ao deletar tarefa: ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return undefined;
  }
}