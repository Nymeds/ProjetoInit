import axios, { AxiosError, AxiosHeaders } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
const TOKEN_STORAGE_KEYS = ["token", "@app:token", "@ignite:token", "access_token"] as const;

interface ApiErrorResponse {
  message?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
}

function readStoredToken(): string {
  for (const key of TOKEN_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  return sessionStorage.getItem("token") ?? "";
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("@app:token");
  localStorage.removeItem("@ignite:token");
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("token");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Extrai uma mensagem de erro amigavel para todas as chamadas da API.
export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim() !== "") {
      return responseMessage;
    }

    if (typeof error.message === "string" && error.message.trim() !== "") {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallbackMessage;
}

export function toApiError(error: unknown, fallbackMessage: string): Error {
  return new Error(getApiErrorMessage(error, fallbackMessage));
}

// Cliente HTTP unico da aplicacao.
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = readStoredToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  },
);

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email e obrigatorio");
  }

  if (!password.trim()) {
    throw new Error("Senha e obrigatoria");
  }

  try {
    const response = await api.post<LoginResponse>("/sessions", {
      email: normalizedEmail,
      password,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Credenciais invalidas");
      }

      if (error.response?.status === 400) {
        throw new Error("Usuario nao encontrado");
      }
    }

    throw toApiError(error, "Erro ao conectar ao servidor");
  }
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<{ user: { id: string; name: string; email: string; role: "ADMIN" | "MEMBER" } }> {
  try {
    const { data } = await api.patch("/users/me", payload);
    return data;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar perfil");
  }
}
