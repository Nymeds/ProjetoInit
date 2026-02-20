import { api, toApiError } from "./auth";

export type GroupPermission =
  | "MANAGE_MEMBERS"
  | "MANAGE_ROLES"
  | "MANAGE_WORKFLOW"
  | "MOVE_TASK"
  | "MOVE_TASK_TO_NO_GROUP"
  | "REMOVE_TASK"
  | "VIEW_HISTORY";

export interface GroupRolePayload {
  id?: string;
  clientKey?: string;
  name: string;
  permissions: GroupPermission[];
  isDefault?: boolean;
}

export interface GroupMemberRoleChangePayload {
  userId: string;
  roleId: string | null;
}

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
  upsertRoles?: GroupRolePayload[];
  removeRoleIds?: string[];
  memberRoleChanges?: GroupMemberRoleChangePayload[];
  relatedGroupIds?: string[];
}

export interface GroupUser {
  id: string;
  name: string;
  email: string;
}

export interface GroupRoleResponse {
  id: string;
  name: string;
  isSystem: boolean;
  isDefault: boolean;
  permissions: Array<{ permission: GroupPermission }>;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  roleInGroup?: "ADMIN" | "MEMBER";
  groupRoleId?: string | null;
  user: GroupUser;
  groupRole?: GroupRoleResponse | null;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  parentGroupId?: string | null;
  parentGroup?: { id: string; name: string } | null;
  childGroups?: Array<{ id: string; name: string }>;
  roles?: GroupRoleResponse[];
  members?: GroupMember[];
}

export interface GroupHistoryEvent {
  id: string;
  action: "TASK_CREATED" | "TASK_MOVED";
  createdAt: string;
  taskTitleSnapshot?: string | null;
  movedOutsideParentName?: string | null;
  description: string;
  actor: GroupUser;
  fromGroup?: { id: string; name: string } | null;
  toGroup?: { id: string; name: string } | null;
  todo?: { id: number; title: string } | null;
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

  const upsertRoles = (data.upsertRoles ?? []).map((role) => {
    const normalizedRoleName = role.name.trim();
    if (!normalizedRoleName) {
      throw new Error("Nome do cargo e obrigatorio");
    }

    if (normalizedRoleName.length > 10) {
      throw new Error("Nome do cargo deve ter no maximo 10 caracteres");
    }

    return {
      ...(role.id ? { id: role.id.trim() } : {}),
      ...(role.clientKey ? { clientKey: role.clientKey.trim() } : {}),
      name: normalizedRoleName,
      permissions: Array.from(new Set(role.permissions)),
      ...(role.isDefault !== undefined ? { isDefault: role.isDefault } : {}),
    };
  });

  const removeRoleIds = (data.removeRoleIds ?? [])
    .map((roleId) => roleId.trim())
    .filter((roleId) => roleId !== "");

  const memberRoleChanges = (data.memberRoleChanges ?? [])
    .map((change) => ({
      userId: change.userId.trim(),
      roleId: change.roleId ? change.roleId.trim() : null,
    }))
    .filter((change) => change.userId !== "");

  const relatedGroupIds = data.relatedGroupIds
    ? Array.from(new Set(data.relatedGroupIds.map((item) => item.trim()).filter(Boolean)))
    : undefined;

  const hasPayload = name !== undefined
    || description !== undefined
    || addUserEmails.length > 0
    || removeUserIds.length > 0
    || upsertRoles.length > 0
    || removeRoleIds.length > 0
    || memberRoleChanges.length > 0
    || relatedGroupIds !== undefined;

  if (!hasPayload) {
    throw new Error("Informe dados para atualizar");
  }

  try {
    const response = await api.put<{ group: GroupResponse }>(`/groups/${encodeURIComponent(groupId)}`, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(addUserEmails.length > 0 ? { addUserEmails } : {}),
      ...(removeUserIds.length > 0 ? { removeUserIds } : {}),
      ...(upsertRoles.length > 0 ? { upsertRoles } : {}),
      ...(removeRoleIds.length > 0 ? { removeRoleIds } : {}),
      ...(memberRoleChanges.length > 0 ? { memberRoleChanges } : {}),
      ...(relatedGroupIds !== undefined ? { relatedGroupIds } : {}),
    });

    return response.data.group;
  } catch (error) {
    throw toApiError(error, "Erro ao atualizar grupo");
  }
}

export async function getGroupHistory(id: string, limit = 60): Promise<GroupHistoryEvent[]> {
  const groupId = normalizeGroupId(id);

  try {
    const response = await api.get<{ history: GroupHistoryEvent[] }>(`/groups/${encodeURIComponent(groupId)}/history`, {
      params: { limit },
    });

    return response.data.history ?? [];
  } catch (error) {
    throw toApiError(error, "Erro ao carregar historico do grupo");
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
