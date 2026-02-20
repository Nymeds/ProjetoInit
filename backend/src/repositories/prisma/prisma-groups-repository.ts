import type {
  GroupPermission,
  GroupRole,
  Prisma,
  PrismaClient,
  User,
} from "@prisma/client";
import { prisma } from "../../utils/prismaClient.js";
import type {
  CreateGroupParams,
  GroupMemberWithRole,
  GroupsRepository,
  GroupTaskHistoryWithRelations,
  GroupWithDetails,
  GroupWorkflowContext,
  RecordGroupTaskHistoryParams,
  UpsertGroupRoleParams,
} from "../groups-repository.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

const ADMIN_PERMISSIONS: GroupPermission[] = [
  "MANAGE_MEMBERS",
  "MANAGE_ROLES",
  "MANAGE_WORKFLOW",
  "MOVE_TASK",
  "MOVE_TASK_TO_NO_GROUP",
  "REMOVE_TASK",
  "VIEW_HISTORY",
];

const MEMBER_PERMISSIONS: GroupPermission[] = ["MOVE_TASK", "VIEW_HISTORY"];

const groupRoleInclude = {
  permissions: true,
} satisfies Prisma.GroupRoleInclude;

const groupInclude = {
  parentGroup: {
    select: { id: true, name: true },
  },
  childGroups: {
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  },
  roles: {
    include: groupRoleInclude,
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  },
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      groupRole: {
        include: groupRoleInclude,
      },
    },
  },
} satisfies Prisma.GroupInclude;

function normalizeRoleName(name: string) {
  return name.trim().toLowerCase();
}

const MAX_ROLE_NAME_LENGTH = 10;

function sanitizeGroupRoleName(name: string): string {
  const roleName = name.trim();
  if (!roleName) {
    throw new Error("Nome do cargo e obrigatorio");
  }

  if (roleName.length > MAX_ROLE_NAME_LENGTH) {
    throw new Error(`Nome do cargo deve ter no maximo ${MAX_ROLE_NAME_LENGTH} caracteres`);
  }

  return roleName;
}

function toGroupDetails(group: any): GroupWithDetails {
  return group as GroupWithDetails;
}

export class PrismaGroupsRepository implements GroupsRepository {
  private async upsertRolePermissions(
    db: DbClient,
    roleId: string,
    permissions: GroupPermission[],
  ) {
    const normalized = Array.from(new Set(permissions));

    await db.groupRolePermission.deleteMany({
      where: {
        roleId,
        permission: {
          notIn: normalized,
        },
      },
    });

    for (const permission of normalized) {
      await db.groupRolePermission.upsert({
        where: {
          roleId_permission: {
            roleId,
            permission,
          },
        },
        update: {},
        create: {
          roleId,
          permission,
        },
      });
    }
  }

  private async ensureSystemRolesWithClient(
    db: DbClient,
    groupId: string,
  ): Promise<{ adminRoleId: string; memberRoleId: string }> {
    const adminRoleId = `sys-admin-${groupId}`;
    const memberRoleId = `sys-member-${groupId}`;

    await db.groupRole.upsert({
      where: { id: adminRoleId },
      update: {
        isSystem: true,
        isDefault: false,
        name: "admin",
      },
      create: {
        id: adminRoleId,
        groupId,
        name: "admin",
        isSystem: true,
        isDefault: false,
      },
    });

    await db.groupRole.upsert({
      where: { id: memberRoleId },
      update: {
        isSystem: true,
        isDefault: true,
        name: "member",
      },
      create: {
        id: memberRoleId,
        groupId,
        name: "member",
        isSystem: true,
        isDefault: true,
      },
    });

    await db.groupRole.updateMany({
      where: { groupId, id: { not: memberRoleId }, isDefault: true },
      data: { isDefault: false },
    });

    await this.upsertRolePermissions(db, adminRoleId, ADMIN_PERMISSIONS);
    await this.upsertRolePermissions(db, memberRoleId, MEMBER_PERMISSIONS);

    await db.userGroup.updateMany({
      where: { groupId, groupRoleId: null },
      data: { groupRoleId: memberRoleId },
    });

    await db.userGroup.updateMany({
      where: { groupId, roleInGroup: "ADMIN" },
      data: { groupRoleId: adminRoleId },
    });

    const adminsCount = await db.userGroup.count({
      where: {
        groupId,
        OR: [{ groupRoleId: adminRoleId }, { roleInGroup: "ADMIN" }],
      },
    });

    if (adminsCount === 0) {
      const firstMembership = await db.userGroup.findFirst({
        where: { groupId },
        orderBy: { userId: "asc" },
      });

      if (firstMembership) {
        await db.userGroup.update({
          where: {
            userId_groupId: {
              userId: firstMembership.userId,
              groupId: firstMembership.groupId,
            },
          },
          data: { groupRoleId: adminRoleId },
        });
      }
    }

    return { adminRoleId, memberRoleId };
  }

  private async ensureSystemRoles(groupId: string) {
    return this.ensureSystemRolesWithClient(prisma, groupId);
  }

  async create({ name, description, userEmails, creatorUserId }: CreateGroupParams): Promise<GroupWithDetails> {
    const normalizedEmails = Array.from(
      new Set(
        userEmails.map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0),
      ),
    );

    const users = await prisma.user.findMany({
      where: { email: { in: normalizedEmails } },
      select: { id: true, email: true },
    });

    if (users.length === 0) {
      throw new Error("Nenhum usuario encontrado com os emails fornecidos");
    }

    const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));
    const usersToAttach: Array<Pick<User, "id" | "email">> = [];

    for (const email of normalizedEmails) {
      const found = usersByEmail.get(email);
      if (found) usersToAttach.push(found);
    }

    if (creatorUserId && !usersToAttach.some((user) => user.id === creatorUserId)) {
      const creator = await prisma.user.findUnique({
        where: { id: creatorUserId },
        select: { id: true, email: true },
      });

      if (creator) usersToAttach.push(creator);
    }

    const createdGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name,
          description: description ?? null,
        },
      });

      const { adminRoleId, memberRoleId } = await this.ensureSystemRolesWithClient(tx, group.id);

      for (const user of usersToAttach) {
        await tx.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id,
            },
          },
          update: {
            groupRoleId: memberRoleId,
          },
          create: {
            groupId: group.id,
            userId: user.id,
            groupRoleId: memberRoleId,
          },
        });
      }

      const adminUserId = creatorUserId ?? usersToAttach[0]?.id;
      if (adminUserId) {
        await tx.userGroup.updateMany({
          where: {
            groupId: group.id,
            userId: adminUserId,
          },
          data: {
            groupRoleId: adminRoleId,
            roleInGroup: "ADMIN",
          },
        });
      }

      return group;
    });

    const withDetails = await this.findById(createdGroup.id);
    if (!withDetails) {
      throw new Error("Falha ao carregar grupo criado");
    }

    return withDetails;
  }

  async delete({ id }: { id: string }): Promise<GroupWithDetails> {
    await this.ensureSystemRoles(id);

    const deleted = await prisma.group.delete({
      where: { id },
      include: groupInclude,
    });

    return toGroupDetails(deleted);
  }

  async addMember(groupId: string, userEmail: string, roleId?: string | null) {
    const normalized = userEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) throw new Error("Usuario nao encontrado");

    const { memberRoleId } = await this.ensureSystemRoles(groupId);

    let selectedRoleId = roleId ?? memberRoleId;
    if (selectedRoleId) {
      const validRole = await prisma.groupRole.findFirst({
        where: { id: selectedRoleId, groupId },
      });
      if (!validRole) {
        selectedRoleId = memberRoleId;
      }
    }

    const existing = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    });

    if (existing) return existing;

    return prisma.userGroup.create({
      data: {
        groupId,
        userId: user.id,
        groupRoleId: selectedRoleId,
      },
    });
  }

  async removeMember(groupId: string, userId: string) {
    const { adminRoleId } = await this.ensureSystemRoles(groupId);
    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) return;

    const isAdmin = membership.groupRoleId === adminRoleId || membership.roleInGroup === "ADMIN";
    if (isAdmin) {
      const adminCount = await prisma.userGroup.count({
        where: {
          groupId,
          OR: [{ groupRoleId: adminRoleId }, { roleInGroup: "ADMIN" }],
        },
      });

      if (adminCount <= 1) {
        throw new Error("Nao e possivel remover o ultimo admin do grupo");
      }
    }

    await prisma.userGroup.deleteMany({
      where: { groupId, userId },
    });
  }

  async findById(id: string): Promise<GroupWithDetails | null> {
    const groupExists = await prisma.group.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!groupExists) return null;

    await this.ensureSystemRoles(id);

    const group = await prisma.group.findUnique({
      where: { id },
      include: groupInclude,
    });

    return group ? toGroupDetails(group) : null;
  }

  async findAll(): Promise<GroupWithDetails[]> {
    const all = await prisma.group.findMany({
      select: { id: true },
    });

    await Promise.all(all.map((group) => this.ensureSystemRoles(group.id)));

    const groups = await prisma.group.findMany({
      include: groupInclude,
    });

    return groups.map(toGroupDetails);
  }

  async findByName(name: string): Promise<GroupWithDetails | null> {
    const found = await prisma.group.findUnique({
      where: { name },
      select: { id: true },
    });

    if (!found) return null;
    return this.findById(found.id);
  }

  async findManyByUser(userId: string): Promise<GroupWithDetails[]> {
    const ids = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      select: { id: true },
    });

    await Promise.all(ids.map((group) => this.ensureSystemRoles(group.id)));

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: groupInclude,
      orderBy: {
        name: "asc",
      },
    });

    return groups.map(toGroupDetails);
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<GroupWithDetails> {
    await this.ensureSystemRoles(id);

    const updated = await prisma.group.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: groupInclude,
    });

    return toGroupDetails(updated);
  }

  async findMember(groupId: string, userId: string): Promise<GroupMemberWithRole | null> {
    await this.ensureSystemRoles(groupId);

    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        groupRole: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return membership as GroupMemberWithRole | null;
  }

  async userHasPermission(groupId: string, userId: string, permission: GroupPermission): Promise<boolean> {
    const membership = await this.findMember(groupId, userId);
    if (!membership) return false;

    if (membership.roleInGroup === "ADMIN") return true;
    if (normalizeRoleName(membership.groupRole?.name ?? "") === "admin") return true;

    return (membership.groupRole?.permissions ?? []).some((item) => item.permission === permission);
  }

  async createRole(groupId: string, data: UpsertGroupRoleParams) {
    await this.ensureSystemRoles(groupId);

    const roleName = sanitizeGroupRoleName(data.name);

    const permissions = Array.from(new Set(data.permissions));
    if (permissions.length === 0) {
      throw new Error("Selecione ao menos uma permissao para o cargo");
    }

    const role = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.groupRole.updateMany({
          where: { groupId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.groupRole.create({
        data: {
          groupId,
          name: roleName,
          isDefault: Boolean(data.isDefault),
        },
      });

      await this.upsertRolePermissions(tx, created.id, permissions);

      return tx.groupRole.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          permissions: true,
        },
      });
    });

    return role;
  }

  async updateRole(groupId: string, roleId: string, data: UpsertGroupRoleParams) {
    await this.ensureSystemRoles(groupId);

    const existing = await prisma.groupRole.findFirst({
      where: { id: roleId, groupId },
      include: { permissions: true },
    });

    if (!existing) {
      throw new Error("Cargo nao encontrado");
    }

    const roleName = sanitizeGroupRoleName(data.name);

    const normalizedExisting = normalizeRoleName(existing.name);
    const normalizedIncoming = normalizeRoleName(roleName);

    if (existing.isSystem && normalizedExisting === "admin" && normalizedIncoming !== "admin") {
      throw new Error("O cargo admin do sistema nao pode ser renomeado");
    }

    const targetPermissions = existing.isSystem && normalizedExisting === "admin"
      ? ADMIN_PERMISSIONS
      : Array.from(new Set(data.permissions));

    if (targetPermissions.length === 0) {
      throw new Error("Selecione ao menos uma permissao para o cargo");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.groupRole.updateMany({
          where: { groupId, isDefault: true, id: { not: roleId } },
          data: { isDefault: false },
        });
      }

      await tx.groupRole.update({
        where: { id: roleId },
        data: {
          name: roleName,
          isDefault: Boolean(data.isDefault),
        },
      });

      await this.upsertRolePermissions(tx, roleId, targetPermissions);

      return tx.groupRole.findUniqueOrThrow({
        where: { id: roleId },
        include: { permissions: true },
      });
    });

    return updated;
  }

  async deleteRole(groupId: string, roleId: string) {
    await this.ensureSystemRoles(groupId);

    const role = await prisma.groupRole.findFirst({
      where: { id: roleId, groupId },
    });

    if (!role) {
      throw new Error("Cargo nao encontrado");
    }

    if (role.isSystem) {
      throw new Error("Nao e possivel remover cargos do sistema");
    }

    const { memberRoleId } = await this.ensureSystemRoles(groupId);

    await prisma.$transaction(async (tx) => {
      await tx.userGroup.updateMany({
        where: { groupId, groupRoleId: roleId },
        data: { groupRoleId: memberRoleId },
      });

      await tx.groupRole.delete({
        where: { id: roleId },
      });
    });
  }

  async assignRoleToMember(groupId: string, userId: string, roleId: string | null) {
    const { adminRoleId, memberRoleId } = await this.ensureSystemRoles(groupId);

    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new Error("Membro nao encontrado no grupo");
    }

    const targetRoleId = roleId ?? memberRoleId;
    if (targetRoleId !== memberRoleId) {
      const targetRole = await prisma.groupRole.findFirst({
        where: {
          id: targetRoleId,
          groupId,
        },
      });
      if (!targetRole) {
        throw new Error("Cargo informado nao pertence ao grupo");
      }
    }

    const isCurrentAdmin = membership.groupRoleId === adminRoleId || membership.roleInGroup === "ADMIN";
    const willRemainAdmin = targetRoleId === adminRoleId;

    if (isCurrentAdmin && !willRemainAdmin) {
      const adminCount = await prisma.userGroup.count({
        where: {
          groupId,
          OR: [{ groupRoleId: adminRoleId }, { roleInGroup: "ADMIN" }],
        },
      });

      if (adminCount <= 1) {
        throw new Error("O grupo precisa manter ao menos um admin");
      }
    }

    await prisma.userGroup.update({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      data: {
        groupRoleId: targetRoleId,
      },
    });
  }

  async setRelatedGroups(groupId: string, relatedGroupIds: string[]) {
    await this.ensureSystemRoles(groupId);

    const uniqueIds = Array.from(
      new Set(relatedGroupIds.map((id) => id.trim()).filter((id) => id.length > 0 && id !== groupId)),
    );

    const existing = uniqueIds.length > 0
      ? await prisma.group.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true },
        })
      : [];

    if (uniqueIds.length > 0 && existing.length !== uniqueIds.length) {
      throw new Error("Um ou mais grupos relacionados nao foram encontrados");
    }

    await prisma.$transaction(async (tx) => {
      await tx.group.updateMany({
        where: { parentGroupId: groupId },
        data: { parentGroupId: null },
      });

      if (uniqueIds.length > 0) {
        await tx.group.updateMany({
          where: { id: { in: uniqueIds } },
          data: { parentGroupId: groupId },
        });
      }
    });
  }

  async getWorkflowContext(groupId: string): Promise<GroupWorkflowContext | null> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        parentGroupId: true,
        parentGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!group) return null;

    const scopeParentId = group.parentGroupId ?? group.id;
    const children = await prisma.group.findMany({
      where: {
        parentGroupId: scopeParentId,
      },
      select: { id: true },
    });

    if (!group.parentGroupId && children.length === 0) {
      return {
        parentGroupId: null,
        parentGroupName: null,
        relatedGroupIds: [],
      };
    }

    if (group.parentGroupId && children.length === 0) {
      return {
        parentGroupId: scopeParentId,
        parentGroupName: group.parentGroup?.name ?? null,
        relatedGroupIds: [group.id],
      };
    }

    return {
      parentGroupId: scopeParentId,
      parentGroupName: group.parentGroupId ? (group.parentGroup?.name ?? null) : group.name,
      relatedGroupIds: children.map((child) => child.id),
    };
  }

  async listTaskHistory(groupId: string, limit = 50): Promise<GroupTaskHistoryWithRelations[]> {
    const normalizedLimit = Math.min(Math.max(limit, 1), 200);

    const events = await prisma.groupTaskHistory.findMany({
      where: {
        OR: [
          { groupId },
          { fromGroupId: groupId },
          { toGroupId: groupId },
          { scopeParentGroupId: groupId },
        ],
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
        fromGroup: {
          select: { id: true, name: true },
        },
        toGroup: {
          select: { id: true, name: true },
        },
        todo: {
          select: { id: true, title: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: normalizedLimit,
    });

    return events as GroupTaskHistoryWithRelations[];
  }

  async recordTaskHistory(data: RecordGroupTaskHistoryParams) {
    await prisma.groupTaskHistory.create({
      data: {
        action: data.action,
        actorId: data.actorId,
        todoId: data.todoId ?? null,
        taskTitleSnapshot: data.taskTitleSnapshot ?? null,
        groupId: data.groupId,
        fromGroupId: data.fromGroupId ?? null,
        toGroupId: data.toGroupId ?? null,
        scopeParentGroupId: data.scopeParentGroupId ?? null,
        movedOutsideParentName: data.movedOutsideParentName ?? null,
      },
    });
  }
}
