import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Interceptor global para logout em 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export async function loginRequest(email: string, password: string) {
  try {
    const response = await api.post("/sessions", { email, password });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.status === 401) throw new Error("Credenciais inválidas");
    if (error.response?.status === 400) throw new Error("Usuário não encontrado");
    throw new Error("Erro ao conectar ao servidor");
  }
}
