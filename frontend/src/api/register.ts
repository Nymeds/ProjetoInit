import axios from "axios";
import { api, toApiError } from "./auth";

export interface RegisterResponse {
  message: string;
}

function normalizeRequiredText(value: string, fieldLabel: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} e obrigatorio`);
  }

  return normalized;
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const normalizedName = normalizeRequiredText(name, "Nome");
  const normalizedEmail = normalizeRequiredText(email, "Email").toLowerCase();

  if (password.trim().length < 6) {
    throw new Error("A senha precisa ter ao menos 6 caracteres");
  }

  try {
    const response = await api.post<RegisterResponse>("/users", {
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new Error("Este email ja esta cadastrado");
    }

    throw toApiError(error, "Erro ao conectar ao servidor");
  }
}
