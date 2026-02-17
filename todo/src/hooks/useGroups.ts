import { useCallback, useEffect, useState } from "react";
import { useError } from "../context/ErrorContext";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";
import { createGroup, deleteGroup, getGroups, type Group, type GroupPayload } from "../services/groups";

export const useGroups = (options?: { enabled?: boolean }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();
  const { user } = useAuth();

  const isEnabled = !!user && (options?.enabled ?? true);

  const fetchGroups = useCallback(async () => {
    if (!isEnabled) {
      setGroups([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const data = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Erro ao carregar grupos");
      showError(message);
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isEnabled, showError]);

  const addGroup = useCallback(
    async (payload: GroupPayload) => {
      try {
        const newGroup = await createGroup(payload);
        setGroups((prev) => [...prev, newGroup]);
        return newGroup;
      } catch (error) {
        const message = getApiErrorMessage(error, "Erro ao criar grupo");
        showError(message);
        throw new Error(message);
      }
    },
    [showError],
  );

  const removeGroup = useCallback(
    async (id: string) => {
      try {
        await deleteGroup(id);
        setGroups((prev) => prev.filter((group) => group.id !== id));
      } catch (error) {
        const message = getApiErrorMessage(error, "Erro ao apagar grupo");
        showError(message);
        throw new Error(message);
      }
    },
    [showError],
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
