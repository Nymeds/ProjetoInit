 

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
  image?: File | null;
}


// Criação de tarefa
export async function createTodo(data: CreateTodoData) {
  const token = getToken();
  if (!token) throw new Error("Token JWT não encontrado");

  const formData = new FormData();

  formData.append("title", data.title);

  if (data.description) {
    formData.append("description", data.description);
  }

  if (data.groupId) {
    formData.append("groupId", data.groupId);
  }

  if (data.image) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${BASE}/todo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ NÃO coloque Content-Type aqui
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erro ao criar tarefa");
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
