import { api, toApiError } from "./auth";

export interface CreateGroupData {
  name: string;
  description?: string;
  userEmails: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  addUserEmails?: string[];
  removeUserIds?: string[];
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

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  members?: GroupMember[];
}

export interface GroupActionResponse {
  message: string;
  group?: GroupResponse;
}

function normalizeRequiredText(value: string, fieldLabel: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${fieldLabel} e obrigatorio`);
  return normalized;
}

function normalizeGroupId(id: string): string {
  return normalizeRequiredText(id, "ID do grupo");
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

export async function createGroup(data: CreateGroupData): Promise<GroupResponse> {
  const name = normalizeRequiredText(data.name, "Nome do grupo");
  const description = data.description?.trim() || undefined;
  const userEmails = normalizeEmails(data.userEmails);

  try {
    const response = await api.post<GroupResponse>("/groups", {
      name,
      description,
      userEmails,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao criar grupo");
  }
}

export async function updateGroup(id: string, data: UpdateGroupData): Promise<GroupResponse> {
  const groupId = normalizeGroupId(id);
  const name = data.name?.trim();
  const description = data.description?.trim();
  const addUserEmails = (data.addUserEmails ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== "");
  const removeUserIds = (data.removeUserIds ?? [])
    .map((userId) => userId.trim())
    .filter((userId) => userId !== "");

  if (name === undefined && description === undefined && addUserEmails.length === 0 && removeUserIds.length === 0) {
    throw new Error("Informe dados para atualizar");
  }

  try {
    const response = await api.put<{ group: GroupResponse }>(`/groups/${encodeURIComponent(groupId)}`, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(addUserEmails.length > 0 ? { addUserEmails } : {}),
      ...(removeUserIds.length > 0 ? { removeUserIds } : {}),
    });
    return response.data.group;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar grupo");
  }
}

export async function deleteGroup(id: string): Promise<GroupActionResponse> {
  const groupId = normalizeGroupId(id);
  try {
    const response = await api.delete<GroupActionResponse>(`/groups/${encodeURIComponent(groupId)}`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao deletar grupo");
  }
}

export async function leaveGroup(id: string): Promise<GroupActionResponse> {
  const groupId = normalizeGroupId(id);
  try {
    const response = await api.delete<GroupActionResponse>(`/groups/${encodeURIComponent(groupId)}/leave`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Erro ao sair do grupo");
  }
}

