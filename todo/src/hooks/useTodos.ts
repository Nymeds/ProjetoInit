import { useCallback, useEffect, useState } from "react";
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

  const normalizeList = (data: any) => {
    const list = data?.todos ?? data;
    return Array.isArray(list) ? list : [];
  };

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await todoService.getTodos();
      setTodos(normalizeList(data));
    } catch (err) {
      console.error("Erro ao carregar todos:", err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      } catch (err) {
        console.error("Erro ao criar todo:", err);
        throw err;
      }
    },
    []
  );

  const removeTodo = useCallback(async (id: string) => {
    try {
      await todoService.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Erro ao deletar todo:", err);
      throw err;
    }
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    try {
      const res = await todoService.completeTodo(id);
      const updated = res?.todo ?? res;

      if (updated) {
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
        );
      }

      return updated;
    } catch (err) {
      console.error("Erro ao completar todo:", err);
      throw err;
    }
  }, []);

 


  return { todos, loading, loadTodos, addTodo, removeTodo, toggleComplete};
}
