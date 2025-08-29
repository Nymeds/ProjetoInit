/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { createTodo } from "../../api/todos";
import Card from "../baseComponents/card";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";

type Props = {
  onCreated?: () => void;
  onCancel?: () => void;
};

export default function NewTaskForm({ onCreated, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Título obrigatório');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await createTodo({ title: title.trim(), description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      onCreated?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4" floating>
      <div className="flex items-start justify-between mb-4">
        <Text variant="heading-small">Nova Tarefa</Text>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="text-accent-paragraph hover:text-white rounded-md p-1"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="new-task-title">
            <Text variant="label-small">Título</Text>
          </label>
          <input
            id="new-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comprar leite"
            className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
          />
        </div>

        <div>
          <label htmlFor="new-task-desc">
            <Text variant="label-small">Descrição (opcional)</Text>
          </label>
          <textarea
            id="new-task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes da tarefa"
            className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            rows={3}
          />
        </div>

        {error && (
          <Text variant="paragraph-small" className="text-danger">
            {error}
          </Text>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar tarefa'}
          </Button>
        </div>
      </form>
    </Card>
  );
}