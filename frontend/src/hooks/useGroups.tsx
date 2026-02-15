import { useQuery } from "@tanstack/react-query";
import { api } from "../api/auth";

export type Group = { id: string; name: string };

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      
      return data.groups ?? [];
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
  });
}
