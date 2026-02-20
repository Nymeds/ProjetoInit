import type {
  Group,
  GroupPermission,
  GroupRole,
  GroupRolePermission,
  GroupTaskHistory,
  UserGroup,
} from "@prisma/client";

export interface CreateGroupParams {
  name: string;
  description?: string | null;
  userEmails: string[];
  creatorUserId?: string;
}

export type GroupRoleWithPermissions = GroupRole & {
  permissions: GroupRolePermission[];
};

export type GroupMemberWithRole = UserGroup & {
  user: {
    id: string;
    name: string;
    email: string;
  };
  groupRole: GroupRoleWithPermissions | null;
};

export type GroupTaskHistoryWithRelations = GroupTaskHistory & {
  actor: {
    id: string;
    name: string;
    email: string;
  };
  fromGroup: Pick<Group, "id" | "name"> | null;
  toGroup: Pick<Group, "id" | "name"> | null;
  todo: {
    id: number;
    title: string;
  } | null;
};

export type GroupWithDetails = Group & {
  parentGroup?: Pick<Group, "id" | "name"> | null;
  childGroups?: Array<Pick<Group, "id" | "name">>;
  roles?: GroupRoleWithPermissions[];
  members?: GroupMemberWithRole[];
};

export interface UpsertGroupRoleParams {
  name: string;
  permissions: GroupPermission[];
  isDefault?: boolean;
}

export interface GroupWorkflowContext {
  parentGroupId: string | null;
  parentGroupName: string | null;
  relatedGroupIds: string[];
}

export interface RecordGroupTaskHistoryParams {
  action: "TASK_CREATED" | "TASK_MOVED";
  actorId: string;
  todoId?: number;
  taskTitleSnapshot?: string | null;
  groupId: string;
  fromGroupId?: string | null;
  toGroupId?: string | null;
  scopeParentGroupId?: string | null;
  movedOutsideParentName?: string | null;
}

export interface GroupsRepository {
  delete(arg0: { id: string }): Promise<GroupWithDetails>;
  findByName(name: string): Promise<GroupWithDetails | null>;
  create(data: CreateGroupParams): Promise<GroupWithDetails>;
  findById(id: string): Promise<GroupWithDetails | null>;
  findAll(): Promise<GroupWithDetails[]>;
  findManyByUser(userId: string): Promise<GroupWithDetails[]>;
  addMember?(groupId: string, userEmail: string, roleId?: string | null): Promise<unknown>;
  removeMember(groupId: string, userId: string): Promise<void>;
  update?(
    id: string,
    data: { name?: string; description?: string | null }
  ): Promise<GroupWithDetails>;
  findMember?(groupId: string, userId: string): Promise<GroupMemberWithRole | null>;
  userHasPermission?(groupId: string, userId: string, permission: GroupPermission): Promise<boolean>;
  createRole?(
    groupId: string,
    data: UpsertGroupRoleParams,
  ): Promise<GroupRoleWithPermissions>;
  updateRole?(
    groupId: string,
    roleId: string,
    data: UpsertGroupRoleParams,
  ): Promise<GroupRoleWithPermissions>;
  deleteRole?(groupId: string, roleId: string): Promise<void>;
  assignRoleToMember?(groupId: string, userId: string, roleId: string | null): Promise<void>;
  setRelatedGroups?(groupId: string, relatedGroupIds: string[]): Promise<void>;
  getWorkflowContext?(groupId: string): Promise<GroupWorkflowContext | null>;
  listTaskHistory?(groupId: string, limit?: number): Promise<GroupTaskHistoryWithRelations[]>;
  recordTaskHistory?(data: RecordGroupTaskHistoryParams): Promise<void>;
}
