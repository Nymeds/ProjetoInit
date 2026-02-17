import { useEffect, useMemo, useState } from "react";
import { Check, Mail, Plus, RefreshCw, UserPlus2, Users } from "lucide-react";
import Card from "../baseComponents/card";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import {
  acceptFriendRequest,
  listFriendRequests,
  listFriends,
  sendFriendRequest,
  type FriendRequestsResponse,
  type FriendUser,
} from "../../api/friends";
import type { DashboardLayoutMode } from "../../types/dashboard-layout";

type FriendRequestItem = FriendRequestsResponse["incoming"][number];
type FriendCardItem = FriendUser & { friendshipId?: string };

interface FriendsSidebarProps {
  layoutMode: DashboardLayoutMode;
  onOpenSettings?: () => void;
}

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

const MAX_VISIBLE_REQUESTS = 3;

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function FriendsSidebar({ layoutMode, onOpenSettings }: FriendsSidebarProps) {
  const [friends, setFriends] = useState<FriendCardItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const visibleIncoming = useMemo(
    () => incomingRequests.slice(0, MAX_VISIBLE_REQUESTS),
    [incomingRequests],
  );

  async function refreshData() {
    setIsLoading(true);

    try {
      const [friendData, requestData] = await Promise.all([
        listFriends(),
        listFriendRequests(),
      ]);

      setFriends(friendData.friends);
      setIncomingRequests(requestData.incoming);
      setOutgoingRequests(requestData.outgoing);
    } catch {
      setFeedback({ type: "error", message: "Nao foi possivel carregar seus amigos." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  async function handleSendRequest() {
    const normalizedEmail = friendEmail.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsSendingRequest(true);
    setFeedback(null);

    try {
      await sendFriendRequest(normalizedEmail);
      setFriendEmail("");
      setFeedback({ type: "success", message: "Solicitacao enviada." });
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar solicitacao.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSendingRequest(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    setAcceptingRequestId(requestId);
    setFeedback(null);

    try {
      await acceptFriendRequest(requestId);
      setFeedback({ type: "success", message: "Solicitacao aceita." });
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao aceitar solicitacao.";
      setFeedback({ type: "error", message });
    } finally {
      setAcceptingRequestId(null);
    }
  }

  const shellClassName = layoutMode === "comfortable"
    ? "border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))]"
    : "border border-border-primary bg-background-quaternary";

  return (
    <Card className={`h-full min-h-[360px] p-0 ${shellClassName}`}>
      <div className="flex h-full flex-col">
        <div className="border-b border-border-primary/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-brand/20">
                <Users className="h-5 w-5 text-accent-brand" />
              </div>
              <div className="min-w-0">
                <Text variant="heading-small" className="text-heading">
                  Amigos
                </Text>
                <Text variant="paragraph-small" className="text-accent-paragraph">
                  {friends.length} conectados
                </Text>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="p-2"
              onClick={() => refreshData()}
              title="Atualizar lista de amigos"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-paragraph/70" />
              <input
                type="email"
                value={friendEmail}
                onChange={(event) => setFriendEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSendRequest();
                  }
                }}
                placeholder="Email do amigo"
                className="w-full rounded-lg border border-border-primary bg-background-secondary py-2 pl-9 pr-3 text-sm text-label placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-accent-brand"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              className="flex h-10 items-center justify-center px-3"
              onClick={handleSendRequest}
              disabled={isSendingRequest || !friendEmail.trim()}
              title="Adicionar amigo"
            >
              {isSendingRequest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Text variant="paragraph-small" className="text-accent-paragraph">
              {incomingRequests.length} pedidos pendentes
            </Text>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-xs font-medium text-accent-brand transition-opacity hover:opacity-80"
              >
                Ver todos
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-border-primary/60 bg-background-secondary/60 p-3">
              <RefreshCw className="h-4 w-4 animate-spin text-accent-brand" />
              <Text variant="paragraph-small" className="text-accent-paragraph">
                Carregando amigos...
              </Text>
            </div>
          )}

          {!isLoading && visibleIncoming.length > 0 && (
            <section className="space-y-2">
              <Text variant="label-small" className="text-heading">
                Pedidos recebidos
              </Text>

              {visibleIncoming.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-border-primary/60 bg-background-secondary/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Text variant="paragraph-small" className="font-semibold text-heading">
                        {request.user.name}
                      </Text>
                      <Text variant="paragraph-small" className="truncate text-accent-paragraph">
                        {request.user.email}
                      </Text>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptingRequestId === request.id}
                      className="shrink-0"
                    >
                      {acceptingRequestId === request.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Aceitar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {!isLoading && (
            <section className="space-y-2">
              <Text variant="label-small" className="text-heading">
                Lista de amigos
              </Text>

              {friends.length === 0 && (
                <div className="rounded-lg border border-dashed border-border-primary p-4 text-center">
                  <UserPlus2 className="mx-auto mb-2 h-5 w-5 text-accent-paragraph" />
                  <Text variant="paragraph-small" className="text-accent-paragraph">
                    Voce ainda nao tem amigos adicionados.
                  </Text>
                </div>
              )}

              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-lg border border-border-primary/60 bg-background-secondary/70 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-brand/20 text-sm font-semibold text-accent-brand">
                    {getInitials(friend.name)}
                  </div>
                  <div className="min-w-0">
                    <Text variant="paragraph-small" className="truncate font-semibold text-heading">
                      {friend.name}
                    </Text>
                    <Text variant="paragraph-small" className="truncate text-accent-paragraph">
                      {friend.email}
                    </Text>
                  </div>
                </div>
              ))}
            </section>
          )}

          {outgoingRequests.length > 0 && (
            <div className="rounded-lg border border-border-primary/60 bg-background-secondary/60 p-3">
              <Text variant="paragraph-small" className="text-accent-paragraph">
                {outgoingRequests.length} convites enviados aguardando resposta.
              </Text>
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-lg border p-3 ${
                feedback.type === "success"
                  ? "border-accent-brand/50 bg-accent-brand/10 text-accent-brand"
                  : "border-accent-red/50 bg-accent-red/10 text-accent-red"
              }`}
            >
              <Text variant="paragraph-small">{feedback.message}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
