import { useQuery } from "@tanstack/react-query";
import { api } from "../api/auth";
import type { GroupResponse } from "../api/groups";
import { useAuth } from "./useAuth";

export type Group = GroupResponse;

export function useGroups(options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery<Group[]>({
    // Cache segmentado por usuario para evitar dado residual apos troca de sessao.
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      return data.groups ?? [];
    },
    enabled: !!user && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
  });
}
