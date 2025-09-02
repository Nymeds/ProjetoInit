/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import Card from "../baseComponents/card";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { createTodo } from "../../api/todos";
import { useGroups } from "../../hooks/useGroups";

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function NewTaskModal({ open, onClose, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const { data: groups = [], isLoading: groupsLoading, refetch } = useGroups();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Título da tarefa obrigatório");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTodo({ title, description, groupId: selectedGroup });
      onCreated?.();

    
      setTitle("");
      setSelectedGroup(undefined);
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background-primary/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <Card className="relative p-6 w-full max-w-md floating">
        <div className="flex justify-between mb-4 items-center">
          <Text variant="heading-small">Nova Tarefa</Text>
          <button
            type="button"
            onClick={onClose}
            className="text-accent-paragraph hover:text-white rounded-md p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Título */}
          <div>
            <label htmlFor="task-title">
              <Text variant="label-small">Título da Tarefa</Text>
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Criar campanha"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="task-desc">
              <Text variant="label-small">Descrição (opcional)</Text>
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a tarefa"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
              rows={3}
            />
          </div>

          {/* Seleção de grupo */}
          <div>
            <label htmlFor="task-group">
              <Text variant="label-small">Grupo (opcional)</Text>
            </label>
            <select
              id="task-group"
              value={selectedGroup || ""}
              onChange={(e) => setSelectedGroup(e.target.value || undefined)}
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
              disabled={groupsLoading}
            >
              <option value="">Selecione um grupo</option>
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <Text variant="paragraph-small" className="text-danger">
              {error}
            </Text>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
