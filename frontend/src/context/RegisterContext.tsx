/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useState } from "react";
import { registerRequest } from "../api/register";

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

interface RegisterContextType {
  registerUser: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}

interface RegisterProviderProps {
  children: ReactNode;
}

export const RegisterContext = createContext<RegisterContextType>(
  {} as RegisterContextType
);

export function RegisterProvider({ children }: RegisterProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function registerUser(data: RegisterFormData) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await registerRequest(data.name, data.email, data.password);
      // Se sucesso, não faz nada, o navigate será chamado no onSubmit
    } catch (err: any) {
      const message = err.message || "Erro ao cadastrar";
      setErrorMessage(message);
      throw new Error(message); // lança para o onSubmit tratar
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <RegisterContext.Provider value={{ registerUser, isLoading, errorMessage }}>
      {children}
    </RegisterContext.Provider>
  );
}
