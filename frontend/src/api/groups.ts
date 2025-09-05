 

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface CreateGroupData {
  name: string;
  description?: string;
  userEmails: string[];
}

// Criação de grupo
export async function createGroup(data: CreateGroupData) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Erro ao criar grupo: ${res.status}`);
  }

  return res.json();
}

// Deleção de grupo
export async function deleteGroup(id: string) {
  if (!id) throw new Error("ID do grupo é obrigatório");
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE}/groups/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Erro ao deletar grupo (status ${res.status})`);
  }

  return res.json();
}
