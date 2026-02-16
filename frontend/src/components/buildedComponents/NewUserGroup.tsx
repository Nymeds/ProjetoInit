/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../baseComponents/Modal";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { createGroup, updateGroup, type GroupResponse } from "../../api/groups";
import { listFriends } from "../../api/friends";
import { useAuth } from "../../hooks/useAuth";

interface FriendItem {
  id: string;
  name: string;
  email: string;
}

interface NewUserGroupFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onGoToAddFriends?: () => void;
  mode?: "create" | "edit";
  groupToEdit?: GroupResponse | null;
}

export default function NewUserGroupForm({
  open,
  onClose,
  onCreated,
  onGoToAddFriends,
  mode = "create",
  groupToEdit = null,
}: NewUserGroupFormProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [removeUserIds, setRemoveUserIds] = useState<string[]>([]);

  const existingMemberIds = useMemo(() => {
    return new Set((groupToEdit?.members ?? []).map((member) => member.userId));
  }, [groupToEdit]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && groupToEdit) {
      setGroupName(groupToEdit.name ?? "");
      setDescription(groupToEdit.description ?? "");
    } else {
      setGroupName("");
      setDescription("");
    }

    setSelectedFriendIds([]);
    setRemoveUserIds([]);
    setError(null);

    listFriends()
      .then((data) => {
        setFriends(data.friends.map((friend) => ({ id: friend.id, name: friend.name, email: friend.email })));
      })
      .catch(() => setFriends([]));
  }, [open, mode, groupToEdit]);

  if (!open) return null;

  function toggleFriendSelection(friendId: string) {
    setSelectedFriendIds((prev) => (
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    ));
  }

  function toggleRemoveUser(userId: string) {
    setRemoveUserIds((prev) => (
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Nome do grupo e obrigatorio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedFriends = friends.filter((friend) => selectedFriendIds.includes(friend.id));
      const selectedFriendEmails = selectedFriends.map((friend) => friend.email.toLowerCase());

      if (mode === "edit") {
        if (!groupToEdit?.id) throw new Error("Grupo invalido para edicao");

        const addUserEmails = selectedFriendEmails.filter((email) => {
          const existing = (groupToEdit.members ?? []).some((member) => member.user.email.toLowerCase() === email);
          return !existing;
        });

        await updateGroup(groupToEdit.id, {
          name: groupName,
          description,
          addUserEmails,
          removeUserIds,
        });
      } else {
        const creatorEmail = user?.email?.trim().toLowerCase();
        const userEmails = Array.from(
          new Set([...(creatorEmail ? [creatorEmail] : []), ...selectedFriendEmails]),
        );

        if (userEmails.length < 2) {
          setError("Adicione pelo menos um amigo para criar o grupo");
          setLoading(false);
          return;
        }

        await createGroup({
          name: groupName,
          description,
          userEmails,
        });
      }

      onCreated?.();
      onClose();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message
        || err?.response?.data
        || err?.message
        || "Erro desconhecido";
      setError(String(backendMsg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Editar Grupo" : "Novo Grupo"}
      className="max-w-lg"
      fullScreenOnMobile
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

        <div>
          <label htmlFor="group-desc">
            <Text variant="label-small">Descricao (opcional)</Text>
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

        {mode === "edit" && groupToEdit && (
          <div className="space-y-2">
            <Text variant="label-small">Membros atuais (remover)</Text>
            <div className="max-h-36 overflow-auto space-y-2 rounded border border-border-primary p-2">
              {(groupToEdit.members ?? []).map((member) => (
                <label key={member.userId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeUserIds.includes(member.userId)}
                    disabled={member.userId === user?.id}
                    onChange={() => toggleRemoveUser(member.userId)}
                  />
                  <span>{member.user.name} ({member.user.email})</span>
                  {member.userId === user?.id && <span className="text-xs text-accent-paragraph">(voce)</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Text variant="label-small">{mode === "edit" ? "Adicionar amigos ao grupo" : "Escolha amigos para o grupo"}</Text>
          <div className="max-h-44 overflow-auto space-y-2 rounded border border-border-primary p-2">
            {friends.length === 0 && (
              <div className="space-y-2">
                <Text variant="paragraph-small" className="text-accent-paragraph">
                  Voce ainda nao tem amigos aceitos. Adicione amigos no seu perfil para iniciar um grupo.
                </Text>
                {onGoToAddFriends && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onGoToAddFriends}
                  >
                    Adicionar amigos
                  </Button>
                )}
              </div>
            )}
            {friends.map((friend) => {
              const alreadyInGroup = mode === "edit" ? existingMemberIds.has(friend.id) : false;
              return (
                <label key={friend.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedFriendIds.includes(friend.id)}
                    disabled={alreadyInGroup}
                    onChange={() => toggleFriendSelection(friend.id)}
                  />
                  <span>{friend.name} ({friend.email})</span>
                  {alreadyInGroup && <span className="text-xs text-accent-paragraph">ja no grupo</span>}
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <Text variant="paragraph-small" className="text-danger">
            {error}
          </Text>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (mode === "edit" ? "Salvando..." : "Criando...") : (mode === "edit" ? "Salvar" : "Criar Grupo")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

