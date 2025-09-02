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
    const text = await res.text().catch(() => null);
    throw new Error(text || `Erro ao criar grupo: ${res.status}`);
  }

  return res.json();
}
