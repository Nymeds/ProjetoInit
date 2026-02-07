/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Modal } from "../baseComponents/Modal";
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
  const [image, setImage] = useState<File | null>(null);
   const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const { data: groups = [], isLoading: groupsLoading, refetch } = useGroups();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open]);
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);


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
     await createTodo({ title, description, groupId: selectedGroup, imageFile })
      onCreated?.();

      setTitle("");
      setSelectedGroup(undefined);
      setDescription("");
      setImageFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Tarefa" className="max-w-md" fullScreenOnMobile>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        <div>
        <label>
          <Text variant="label-small">Imagem (opcional)</Text>
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-accent-paragraph"
        />
      </div>


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
         <div>
          <label htmlFor="task-image">
            <Text variant="label-small">Imagem (opcional)</Text>
          </label>
          <input
            id="task-image"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
          />
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Pré-visualização da imagem da tarefa"
              className="mt-3 max-h-48 w-full rounded border border-border-primary object-contain"
            />
          )}
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
    </Modal>
  );
}
