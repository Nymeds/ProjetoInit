// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE = (import.meta.env as any).VITE_API_URL || "http://localhost:3333";

export interface CreateGroupData {
  name: string;
  description?: string;
  userEmails: string[];
}

export async function createGroup(data: CreateGroupData) {
  const token = localStorage.getItem("token") || "";
  const url = `${BASE}/groups`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorMessage = `Erro ao criar grupo: ${res.status}`;

    try {
      // tenta ler como JSON
      const errorData = await res.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // fallback para texto cru
      const text = await res.text().catch(() => null);
      if (text) errorMessage = text;
    }

    throw new Error(errorMessage);
  }

  return res.json();
}
