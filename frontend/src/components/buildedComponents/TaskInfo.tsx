 
import { useState } from "react";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import Card from "../baseComponents/card";
import { deleteTodo } from "../../api/todos";
import type { Todo } from "../../types/types";

interface TaskInfoProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; 
  todo: Todo;
}

export default function TaskInfo({ open, onClose, todo, onCreated }: TaskInfoProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTodo(todo.id.toString());
      onCreated?.(); 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Erro ao deletar tarefa");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <Card className="!bg-background-primary p-6 w-full max-w-lg rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <Text variant="heading-medium" className="text-white">
            {todo.title}
          </Text>
          <button
            onClick={onClose}
            className="text-accent-red font-bold hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <Text variant="paragraph-small" className="text-red-500 mb-4">
            {error}
          </Text>
        )}

        <div className="space-y-2 mb-6">
          <Text variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Descrição:</span> {todo.description ?? "Sem descrição"}
          </Text>

          <Text variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Grupo:</span> {todo.group?.name ?? "Sem grupo"}
          </Text>

          <Text variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Criado em:</span>{" "}
            {new Date(todo.createdAt).toLocaleDateString("pt-BR")}
          </Text>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleDelete}
            variant="secondary"
            disabled={deleting}
            className="hover:bg-red-600"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
          <Button onClick={onClose} variant="primary">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
}
