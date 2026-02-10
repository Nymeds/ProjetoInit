 
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/auth";
import { useAuth } from "./useAuth";

export function useTodos(options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data } = await api.get("/todo");
      return data.todos ?? [];
    },
    enabled: !!user && (options?.enabled ?? true), 
  });
}
