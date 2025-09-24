import { createContext, ReactNode, useContext, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";

type ErrorContextType = {
  showError: (msg: string) => void;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  const showError = (msg: string) => setError(msg);
  const hideError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && <ErrorMessage message={error} onHide={hideError} />}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used within ErrorProvider");
  return context;
};
