import axios from "axios";


export const api = axios.create({
  baseURL: "http://localhost:3333",
  withCredentials: true,
});

export async function loginRequest(email: string, password: string) {
  try {
    const response = await api.post("/sessions", { email, password });
    return response.data; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Credenciais inválidas");
    }else if (error.response?.status == 400){
      throw new Error("Usuario não encontrado")
    }
    throw new Error("Erro ao conectar ao servidor");
  }
}
