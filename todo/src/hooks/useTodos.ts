import { useCallback, useEffect, useState } from "react";
import { useError } from "../context/ErrorContext";
import * as todoService from "../services/todos";

export type Todo = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: string;
  group?: { id: string; name: string } | null;
  groupId?: string | null;
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const normalizeList = (data: any) => {
    const list = data?.todos ?? data;
    return Array.isArray(list) ? list : [];
  };

  const loadTodos = useCallback(async () => {
    try {

      setLoading(true);
      const data = await todoService.getTodos();
      setTodos(normalizeList(data));
    } catch (err: any) {
      console.error("Erro ao carregar todos:", err);
      showError(err.response?.data?.message || "Erro ao carregar todos");
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback(
    async (payload: { title: string; description?: string; groupId?: string }) => {
      try {
        const res = await todoService.createTodo(payload);
        const newTodo = res?.todo ?? res;
        if (newTodo) setTodos((prev) => [...prev, newTodo]);
        return newTodo;
      } catch (err: any) {
        console.error("Erro ao criar todo:", err);
        showError(err.response?.data?.message || "Erro ao criar todo");
        throw err;
      }
    },
    [showError]
  );

  const removeTodo = useCallback(
    async (id: string) => {
      try {
        await todoService.deleteTodo(id);
        setTodos((prev) => prev.filter((t) => t.id !== id));
      } catch (err: any) {
       
        showError(err.response?.data?.message || "Erro ao deletar todo");
        throw err;
      }
    },
    [showError]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      try {
        const res = await todoService.completeTodo(id);
        const updated = res?.todo ?? res;

        if (updated) {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
          );
        }

        return updated;
      } catch (err: any) {
        console.error("Erro ao completar todo:", err);
        showError(err.response?.data?.message || "Erro ao atualizar todo");
        throw err;
      }
    },
    [showError]
  );

  return { todos, loading, loadTodos, addTodo, removeTodo, toggleComplete };
}
