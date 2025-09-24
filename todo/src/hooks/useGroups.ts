import { useCallback, useEffect, useState } from "react";
import { Group, getGroups, GroupPayload, createGroup, deleteGroup } from "../services/groups";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addGroup = useCallback(async (payload: GroupPayload) => {
    try {
      const newGroup = await createGroup(payload);
      if (!newGroup?.id) throw new Error("O backend não retornou o ID do grupo");

      // Atualiza state localmente sem precisar esperar fetch
      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Erro desconhecido";
      throw new Error(backendMsg);
    }
  }, []);

  const removeGroup = useCallback(async (id: string) => {
    try {
      await deleteGroup(id);
      setGroups((prev) => prev.filter((group) => group.id !== id));
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Erro desconhecido";
      throw new Error(backendMsg);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    fetchGroups,
    addGroup,
    removeGroup,
  };
};
