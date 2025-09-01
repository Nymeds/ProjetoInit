/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
});

export async function registerRequest(name: string, email: string, password: string) {
  try {
    const response = await api.post("/users", { name, email, password });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error("Este email já está cadastrado");
    }
    throw new Error("Erro ao conectar ao servidor");
  }
}
