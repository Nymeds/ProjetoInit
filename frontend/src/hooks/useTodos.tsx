import { useQuery } from "@tanstack/react-query";
import { api } from "../api/auth";
import { useAuth } from "./useAuth";
import type { Todo } from "../types/types";

export function useTodos(options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery<Todo[]>({
    // Inclui userId para evitar misturar cache entre usuarios diferentes.
    queryKey: ["todos", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/todo");
      return data.todos ?? [];
    },
    enabled: !!user && (options?.enabled ?? true),
  });
}
