/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Modal } from "../baseComponents/Modal";
import Card from "../baseComponents/card";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { createGroup } from "../../api/groups";
import { useAuth } from "../../hooks/useAuth";

interface NewUserGroupFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function NewUserGroupForm({ open, onClose, onCreated }: NewUserGroupFormProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setUserEmails(user?.email ? [user.email] : []);
    }
  }, [open, user?.email]);

  if (!open) return null;

  function handleEmailChange(index: number, value: string) {
    const newEmails = [...userEmails];
    newEmails[index] = value;
    setUserEmails(newEmails);
  }

  function handleAddEmail() {
    setUserEmails([...userEmails, ""]);
  }

  function handleRemoveEmail(index: number) {
    setUserEmails(userEmails.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Nome do grupo é obrigatório");
      return;
    }

    // Validações: pelo menos 2 membros e sem emails duplicados
    const cleaned = userEmails.map((s) => s.trim()).filter((s) => s !== "");
    if (cleaned.length < 2) {
      setError("O grupo precisa ter pelo menos 2 membros");
      return;
    }

    const lower = cleaned.map((s) => s.toLowerCase());
    const unique = new Set(lower);
    if (unique.size !== lower.length) {
      setError("Emails duplicados não são permitidos");
      return;
    }

    // Simple email format check
    const invalid = cleaned.find((em) => !/^\S+@\S+\.\S+$/.test(em));
    if (invalid) {
      setError(`Email inválido: ${invalid}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: groupName,
        description,
        userEmails: cleaned,
      };

      await createGroup(payload);
      onCreated?.();
      onClose();

      // Reset campos
      setGroupName("");
      setDescription("");
      setUserEmails(user?.email ? [user.email] : []);
    } catch (err: any) {
      let backendMsg = "Erro desconhecido";

      const data = err.response?.data;

      if (data) {
        if (typeof data === "object" && "message" in data) {
          backendMsg = data.message; 
        } else if (typeof data === "string") {
          backendMsg = data;
        }
      } else if (err.message) {
        backendMsg = err.message;
      }

      
      if (backendMsg.includes("Unique constraint failed")) {
        backendMsg = "Já existe um grupo com esse nome";
      }

      setError(backendMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Grupo" className="max-w-md" fullScreenOnMobile>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Nome do grupo */}
          <div>
            <label htmlFor="group-name">
              <Text variant="label-small">Nome do grupo</Text>
            </label>
            <input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Marketing"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
          </div>

          {/* Emails */}
          <div>
            <Text variant="label-small">Membros (emails)</Text>
            {userEmails.map((email, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`email${index + 1}@exemplo.com`}
                  className="flex-1 p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
                />
                {userEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="text-danger hover:text-white px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmail}
              className="text-accent-brand mt-2 text-sm hover:underline"
            >
              + Adicionar outro
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="group-desc">
              <Text variant="label-small">Descrição (opcional)</Text>
            </label>
            <textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o grupo"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
              rows={3}
            />
          </div>

          {/* Erro */}
          {error && (
            <Text variant="paragraph-small" className="text-danger">
              {error}
            </Text>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Criando..." : "Criar Grupo"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
