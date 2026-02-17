import { useCallback, useEffect, useState } from "react";
import { useError } from "../context/ErrorContext";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";
import { completeTodo, createTodo, deleteTodo, getTodos, type Todo } from "../services/todos";

export type { Todo };

export function useTodos(options?: { enabled?: boolean }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();
  const { user } = useAuth();

  const isEnabled = !!user && (options?.enabled ?? true);

  const loadTodos = useCallback(async () => {
    if (!isEnabled) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data.todos ?? []);
    } catch (error) {
      const message = getApiErrorMessage(error, "Erro ao carregar tarefas");
      showError(message);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [isEnabled, showError]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback(
    async (payload: { title: string; description?: string; groupId?: string }) => {
      const response = await createTodo(payload);
      const newTodo = response.todo;
      setTodos((prev) => [...prev, newTodo]);
      return newTodo;
    },
    [],
  );

  const removeTodo = useCallback(
    async (id: number | string) => {
      try {
        await deleteTodo(id);
        setTodos((prev) => prev.filter((todo) => String(todo.id) !== String(id)));
      } catch (error) {
        const message = getApiErrorMessage(error, "Erro ao deletar tarefa");
        showError(message);
        throw error;
      }
    },
    [showError],
  );

  const toggleComplete = useCallback(
    async (id: number | string) => {
      try {
        const response = await completeTodo(id);
        const updated = response.todo;

        setTodos((prev) =>
          prev.map((todo) =>
            String(todo.id) === String(id)
              ? {
                  ...todo,
                  completed: updated.completed,
                }
              : todo,
          ),
        );

        return updated;
      } catch (error) {
        const message = getApiErrorMessage(error, "Erro ao atualizar tarefa");
        showError(message);
        throw error;
      }
    },
    [showError],
  );

  return { todos, loading, loadTodos, addTodo, removeTodo, toggleComplete };
}
