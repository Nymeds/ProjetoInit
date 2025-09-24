import { useCallback, useEffect, useState } from "react";
import { useError } from "../context/ErrorContext";
import { Group, GroupPayload, getGroups, createGroup, deleteGroup } from "../services/groups";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError(); 

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      showError(err?.response?.data?.message || "Erro ao carregar grupos");
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addGroup = useCallback(
    async (payload: GroupPayload) => {
      try {
        const newGroup = await createGroup(payload);
        if (!newGroup?.id) throw new Error("O backend não retornou o ID do grupo");
        setGroups((prev) => [...prev, newGroup]);
        return newGroup;
      } catch (err: any) {
        const backendMsg =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Erro desconhecido";
        showError(backendMsg);
        throw new Error(backendMsg);
      }
    },
    [showError]
  );

  const removeGroup = useCallback(
    async (id: string) => {
      try {
        await deleteGroup(id);
        setGroups((prev) => prev.filter((group) => group.id !== id));
      } catch (err: any) {
        const backendMsg =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Erro desconhecido";
        showError(backendMsg);
        throw new Error(backendMsg);
      }
    },
    [showError]
  );

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
