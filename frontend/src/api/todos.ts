export interface CreateTodoData {
  title: string;
  description?: string;
}

const BASE = (import.meta.env as any).VITE_API_URL || 'http://localhost:3333';

export async function createTodo(data: CreateTodoData) {
  const token = localStorage.getItem('token') || localStorage.getItem('@app:token') || '';

  // payload sem description quando vazio (você disse que ainda não há descrição)
  const payload: Record<string, unknown> = { title: data.title };
  if (data.description) payload.description = data.description;

  const url = `${BASE}/todo`;

  // DEBUG: descomente se quiser checar token no console
  // console.log('POST', url, 'tokenExists=', Boolean(token), 'payload=', payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    const text = await res.text().catch(() => null);
    throw new Error(`404 ao criar tarefa em ${url}. Resposta do servidor: ${text || 'sem corpo'}. Verifique URL/proxy/backend.`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Erro ao criar tarefa: ${res.status}`);
  }

  return res.json();
}