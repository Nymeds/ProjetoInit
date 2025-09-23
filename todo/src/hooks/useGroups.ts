import { useState, useEffect, useCallback } from "react";
import { Group, GroupPayload, createGroup, getGroups } from "../services/groups";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addGroup = useCallback(async (payload: GroupPayload) => {
    try {
      const newGroup = await createGroup(payload);
      if (!newGroup?.id) {
        throw new Error("O backend não retornou o ID do grupo");
      }
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

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    fetchGroups,
    addGroup,
  };
};
