import { useEffect, useMemo, useState } from "react";
import { Modal } from "../baseComponents/Modal";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { acceptFriendRequest, listFriendRequests, listFriends, sendFriendRequest } from "../../api/friends";
import { updateMyProfile } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";

interface UserSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ open, onClose }: UserSettingsModalProps) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friends, setFriends] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [incomingRequests, setIncomingRequests] = useState<Array<{ id: string; user: { id: string; name: string; email: string } }>>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Array<{ id: string; user: { id: string; name: string; email: string } }>>([]);

  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase() || password.trim().length > 0;
  }, [user, name, email, password]);

  async function refreshFriendsData() {
    const [friendData, requestData] = await Promise.all([listFriends(), listFriendRequests()]);
    setFriends(friendData.friends.map((friend) => ({ id: friend.id, name: friend.name, email: friend.email })));
    setIncomingRequests(requestData.incoming);
    setOutgoingRequests(requestData.outgoing);
  }

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setError(null);
    setSuccess(null);

    refreshFriendsData().catch(() => {
      setError("Nao foi possivel carregar seus amigos");
    });
  }, [open, user]);

  if (!open || !user) return null;

  async function handleSaveProfile() {
    if (!hasProfileChanges) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: { name?: string; email?: string; password?: string } = {};
      if (name.trim() !== user.name) payload.name = name.trim();
      if (email.trim().toLowerCase() !== user.email.toLowerCase()) payload.email = email.trim().toLowerCase();
      if (password.trim()) payload.password = password.trim();

      const { user: updatedUser } = await updateMyProfile(payload);
      setUser(updatedUser);
      setPassword("");
      setSuccess("Perfil atualizado com sucesso");
    } catch (err: any) {
      setError(err?.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendFriendRequest() {
    if (!friendEmail.trim()) return;

    setSendingFriendRequest(true);
    setError(null);
    setSuccess(null);

    try {
      await sendFriendRequest(friendEmail);
      setFriendEmail("");
      setSuccess("Solicitacao enviada");
      await refreshFriendsData();
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar solicitacao");
    } finally {
      setSendingFriendRequest(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    setError(null);
    setSuccess(null);

    try {
      await acceptFriendRequest(requestId);
      setSuccess("Solicitacao aceita");
      await refreshFriendsData();
    } catch (err: any) {
      setError(err?.message || "Erro ao aceitar solicitacao");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Perfil e Amigos" className="max-w-2xl" fullScreenOnMobile>
      <div className="space-y-5">
        <section className="space-y-3">
          <Text variant="heading-small" className="text-heading">Editar Perfil</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Nova senha (opcional)"
            className="w-full p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
          />
          <div className="flex justify-end">
            <Button variant="primary" disabled={loading || !hasProfileChanges} onClick={handleSaveProfile}>
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </section>

        <section className="space-y-3 border-t border-border-primary pt-4">
          <Text variant="heading-small" className="text-heading">Adicionar Amigo</Text>
          <div className="flex gap-2">
            <input
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Email do amigo"
              className="flex-1 p-2 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
            <Button variant="primary" disabled={sendingFriendRequest || !friendEmail.trim()} onClick={handleSendFriendRequest}>
              {sendingFriendRequest ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-primary pt-4">
          <div className="space-y-2">
            <Text variant="heading-small" className="text-heading">Pedidos Recebidos</Text>
            {incomingRequests.length === 0 && (
              <Text variant="paragraph-small" className="text-accent-paragraph">Nenhum pedido pendente</Text>
            )}
            {incomingRequests.map((requestItem) => (
              <div key={requestItem.id} className="p-2 rounded border border-border-primary flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Text variant="label-small" className="truncate">{requestItem.user.name}</Text>
                  <Text variant="paragraph-small" className="text-accent-paragraph truncate">{requestItem.user.email}</Text>
                </div>
                <Button size="sm" variant="primary" onClick={() => handleAcceptRequest(requestItem.id)}>
                  Aceitar
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Text variant="heading-small" className="text-heading">Amigos</Text>
            {friends.length === 0 && (
              <Text variant="paragraph-small" className="text-accent-paragraph">Voce ainda nao tem amigos</Text>
            )}
            {friends.map((friend) => (
              <div key={friend.id} className="p-2 rounded border border-border-primary">
                <Text variant="label-small">{friend.name}</Text>
                <Text variant="paragraph-small" className="text-accent-paragraph">{friend.email}</Text>
              </div>
            ))}
            {outgoingRequests.length > 0 && (
              <div className="pt-2">
                <Text variant="label-small" className="text-heading">Pedidos enviados</Text>
                {outgoingRequests.map((requestItem) => (
                  <Text key={requestItem.id} variant="paragraph-small" className="text-accent-paragraph">
                    {requestItem.user.name} ({requestItem.user.email})
                  </Text>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && <Text variant="paragraph-small" className="text-danger">{error}</Text>}
        {success && <Text variant="paragraph-small" className="text-accent-brand">{success}</Text>}
      </div>
    </Modal>
  );
}

