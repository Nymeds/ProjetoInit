import api, { toApiError } from "./api";

export interface GroupPayload {
  name: string;
  description?: string;
  userEmails: string[];
}

export interface GroupUser {
  id: string;
  name: string;
  email: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  user: GroupUser;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  members?: GroupMember[];
}

export interface GroupActionResponse {
  message: string;
  group?: Group;
}

function normalizeRequiredText(value: string, fieldLabel: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} e obrigatorio`);
  }

  return normalized;
}

function normalizeEmails(emails: string[]): string[] {
  const normalized = emails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== "");

  if (normalized.length === 0) {
    throw new Error("Informe ao menos um email para o grupo");
  }

  return normalized;
}

export const createGroup = async (payload: GroupPayload): Promise<Group> => {
  const name = normalizeRequiredText(payload.name, "Nome do grupo");
  const description = payload.description?.trim() || undefined;
  const userEmails = normalizeEmails(payload.userEmails);

  try {
    const response = await api.post<Group>("/groups", {
      name,
      description,
      userEmails,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao criar grupo");
  }
};

export const getGroups = async (): Promise<Group[]> => {
  try {
    const response = await api.get<{ groups?: Group[] }>("/groups");
    return response.data.groups ?? [];
  } catch (error) {
    throw toApiError(error, "Erro ao carregar grupos");
  }
};

export const deleteGroup = async (id: string): Promise<GroupActionResponse> => {
  const groupId = normalizeRequiredText(id, "ID do grupo");

  try {
    const response = await api.delete<GroupActionResponse>(`/groups/${encodeURIComponent(groupId)}`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao apagar grupo");
  }
};

export const leaveGroup = async (id: string): Promise<GroupActionResponse> => {
  const groupId = normalizeRequiredText(id, "ID do grupo");

  try {
    const response = await api.delete<GroupActionResponse>(`/groups/${encodeURIComponent(groupId)}/leave`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao sair do grupo");
  }
};
