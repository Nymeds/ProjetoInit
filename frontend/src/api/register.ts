import { api } from "./auth";

export async function registerRequest(name: string, email: string, password: string) {
  try {
    const response = await api.post("/users", { name, email, password });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error("Este email já está cadastrado");
    }
    throw new Error("Erro ao conectar ao servidor");
  }
}
