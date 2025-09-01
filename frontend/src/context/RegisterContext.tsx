// RegisterContext.tsx
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

// eslint-disable-next-line react-refresh/only-export-components
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
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao cadastrar");
     
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
