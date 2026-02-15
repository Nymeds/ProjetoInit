import { api, toApiError } from "./auth";

export interface FriendUser {
  id: string;
  name: string;
  email: string;
}

export interface FriendListResponse {
  friends: Array<FriendUser & { friendshipId: string }>;
}

export interface FriendRequestsResponse {
  incoming: Array<{ id: string; createdAt: string; user: FriendUser }>;
  outgoing: Array<{ id: string; createdAt: string; user: FriendUser }>;
}

export async function listFriends(): Promise<FriendListResponse> {
  try {
    const { data } = await api.get<FriendListResponse>("/friends");
    return data;
  } catch (error) {
    throw toApiError(error, "Erro ao listar amigos");
  }
}

export async function listFriendRequests(): Promise<FriendRequestsResponse> {
  try {
    const { data } = await api.get<FriendRequestsResponse>("/friends/requests");
    return data;
  } catch (error) {
    throw toApiError(error, "Erro ao listar solicitacoes de amizade");
  }
}

export async function sendFriendRequest(email: string) {
  try {
    const { data } = await api.post("/friends/requests", { email: email.trim().toLowerCase() });
    return data;
  } catch (error) {
    throw toApiError(error, "Erro ao enviar solicitacao de amizade");
  }
}

export async function acceptFriendRequest(id: string) {
  try {
    const { data } = await api.patch(`/friends/requests/${encodeURIComponent(id)}/accept`);
    return data;
  } catch (error) {
    throw toApiError(error, "Erro ao aceitar solicitacao de amizade");
  }
}

