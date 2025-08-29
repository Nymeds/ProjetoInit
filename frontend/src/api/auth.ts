interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch("http://localhost:3333/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Erro ao logar");
  }

  return res.json();
}
