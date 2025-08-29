
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/auth";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await api.get("/todo");
      return response.data.todos; 
    },
    staleTime: 1000 * 60,
  });
}
