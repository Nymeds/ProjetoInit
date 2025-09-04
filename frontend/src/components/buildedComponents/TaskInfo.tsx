/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import Card from "../baseComponents/card";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { deleteTodo } from '../../api/todos';
import type { Todo } from "../../types/types";

interface TaskInfoProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  todo : Todo;
}

export default function TaskInfo ({open,onClose,todo}: TaskInfoProps){

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm('Deseja realmente excluir esta tarefa?')) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTodo(todo.id.toString()); 
      onDeleted?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar tarefa');
    } finally {
      setDeleting(false);
    }
  }
  return (
  open && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <Card className="bg-background-secondary p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <Text variant="heading-medium">{todo.title}</Text>
          <button onClick={onClose} className="text-accent-red">X</button>
        </div>

        {todo.description && (
          <Text variant="paragraph-small" className="mb-4">
            {todo.description}
          </Text>
        )}
        <Text variant="paragraph-small">
          Descrição: {todo.description?? "Sem descrição"}
        </Text>

        <Text variant="paragraph-small">
          Grupo: {todo.group?.name ?? "Sem grupo"}
        </Text>

        <Text variant="paragraph-small">
          Criado em: {new Date(todo.createdAt).toLocaleDateString("pt-BR")}
        </Text>

        <div className="mt-6 flex justify-end gap-2">
          <Button 
            onClick={handleDelete} 
            variant="secondary" 
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
          <Button onClick={onClose} variant="primary">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
);

}

function onDeleted() {
    throw new Error("Function not implemented.");
}
