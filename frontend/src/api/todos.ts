const BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("@app:token") ||
    localStorage.getItem("@ignite:token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

export interface CreateTodoData {
  title: string;
  description?: string;
  groupId?: string;
  imageFile?: File | null;
}

// Criação de tarefa
export async function createTodo(data: CreateTodoData) {
  const token = getToken();
  if (!token) throw new Error("Token JWT não encontrado");

  const hasImage = Boolean(data.imageFile);
  let body: FormData | string;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  if (hasImage) {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.groupId) formData.append("groupId", data.groupId);
    if (data.imageFile) formData.append("image", data.imageFile);
    body = formData;
  } else {
    const payload: Record<string, unknown> = { title: data.title };
    if (data.description) payload.description = data.description;
    if (data.groupId) payload.groupId = data.groupId;
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }

  const res = await fetch(`${BASE}/todo`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let message = text || `Erro ao criar tarefa: ${res.status}`;
    try {
      const parsed = JSON.parse(text || '');
      if (parsed?.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

// Deleção de tarefa
export async function deleteTodo(id: string) {
  if (!id) throw new Error("ID da tarefa é obrigatório");
  const token = getToken();
  if (!token) throw new Error("Token JWT não encontrado");

  const res = await fetch(`${BASE}/todo/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let message = text || `Erro ao deletar tarefa: ${res.status}`;
    try {
      const parsed = JSON.parse(text || '');
      if (parsed?.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

// Atualizar status de tarefa
export async function updateTodo(id: string) {
  if (!id) throw new Error("ID da tarefa é obrigatório");
  const token = getToken();
  if (!token) throw new Error("Token JWT não encontrado");

  const res = await fetch(`${BASE}/todo/${encodeURIComponent(id)}/complete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let message = text || `Erro ao atualizar tarefa: ${res.status}`;
    try {
      const parsed = JSON.parse(text || '');
      if (parsed?.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
