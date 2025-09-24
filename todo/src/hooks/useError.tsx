import { useState } from "react";

export function useError() {
  const [error, setError] = useState<string | null>(null);

  const showError = (msg: string) => setError(msg);
  const hideError = () => setError(null);

  return { error, showError, hideError };
}
