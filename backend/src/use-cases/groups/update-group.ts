import type { GroupPermission } from "@prisma/client";
import type { GroupWithDetails, GroupsRepository } from "../../repositories/groups-repository.js";

interface UpdateRolePayload {
  id?: string;
  clientKey?: string;
  name: string;
  permissions: GroupPermission[];
  isDefault?: boolean;
}

interface UpdateMemberRolePayload {
  userId: string;
  roleId: string | null;
}

interface UpdateGroupUseCaseRequest {
  groupId: string;
  userId: string;
  name?: string;
  description?: string;
  addUserEmails?: string[];
  removeUserIds?: string[];
  upsertRoles?: UpdateRolePayload[];
  removeRoleIds?: string[];
  memberRoleChanges?: UpdateMemberRolePayload[];
  relatedGroupIds?: string[];
}

interface UpdateGroupUseCaseResponse {
  group: GroupWithDetails;
}

export class UpdateGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  private async assertPermission(groupId: string, userId: string, permission: GroupPermission, denyMessage: string) {
    if (!this.groupsRepository.userHasPermission) return;

    const allowed = await this.groupsRepository.userHasPermission(groupId, userId, permission);
    if (!allowed) {
      throw new Error(denyMessage);
    }
  }

  async execute({
    groupId,
    userId,
    name,
    description,
    addUserEmails,
    removeUserIds,
    upsertRoles,
    removeRoleIds,
    memberRoleChanges,
    relatedGroupIds,
  }: UpdateGroupUseCaseRequest): Promise<UpdateGroupUseCaseResponse> {
    const group = await this.groupsRepository.findById(groupId);

    if (!group) {
      throw new Error("Grupo nao encontrado");
    }

    const isMember = (group.members ?? []).some((member) => member.userId === userId);
    if (!isMember) {
      throw new Error("Nao autorizado para atualizar este grupo");
    }

    const isEditingCore = name !== undefined || description !== undefined;
    const hasMembersChanges = (addUserEmails?.length ?? 0) > 0 || (removeUserIds?.length ?? 0) > 0;
    const hasRolesChanges = (upsertRoles?.length ?? 0) > 0
      || (removeRoleIds?.length ?? 0) > 0
      || (memberRoleChanges?.length ?? 0) > 0;
    const hasWorkflowChanges = relatedGroupIds !== undefined;

    if (isEditingCore || hasWorkflowChanges) {
      await this.assertPermission(groupId, userId, "MANAGE_WORKFLOW", "Nao autorizado para alterar configuracoes do grupo");
    }

    if (hasMembersChanges) {
      await this.assertPermission(groupId, userId, "MANAGE_MEMBERS", "Nao autorizado para gerenciar membros");
    }

    if (hasRolesChanges) {
      await this.assertPermission(groupId, userId, "MANAGE_ROLES", "Nao autorizado para gerenciar cargos");
    }

    const nextName = name?.trim();
    const nextDescription = description?.trim();

    if (name !== undefined && !nextName) {
      throw new Error("Nome do grupo e obrigatorio");
    }

    if (nextName && nextName !== group.name) {
      const duplicated = await this.groupsRepository.findByName(nextName);
      if (duplicated && duplicated.id !== groupId) {
        throw new Error("Ja existe um grupo com esse nome");
      }
    }

    if (isEditingCore) {
      if (!this.groupsRepository.update) {
        throw new Error("Repositorio nao suporta atualizacao de grupo");
      }

      await this.groupsRepository.update(groupId, {
        name: nextName,
        description: description !== undefined ? (nextDescription || null) : undefined,
      });
    }

    const emailsToAdd = Array.from(
      new Set((addUserEmails ?? []).map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0)),
    );

    if (emailsToAdd.length > 0) {
      if (!this.groupsRepository.addMember) {
        throw new Error("Repositorio nao suporta adicao de membros");
      }

      for (const email of emailsToAdd) {
        await this.groupsRepository.addMember(groupId, email);
      }
    }

    const usersToRemove = Array.from(
      new Set((removeUserIds ?? []).map((id) => id.trim()).filter((id) => id.length > 0)),
    );

    for (const memberId of usersToRemove) {
      await this.groupsRepository.removeMember(groupId, memberId);
    }

    const rolesToUpsert = upsertRoles ?? [];
    const createdRolesByClientKey = new Map<string, string>();
    if (rolesToUpsert.length > 0) {
      if (!this.groupsRepository.createRole || !this.groupsRepository.updateRole) {
        throw new Error("Repositorio nao suporta gerenciar cargos");
      }

      for (const role of rolesToUpsert) {
        const isTempRole = role.id?.startsWith("tmp:");
        if (role.id && !isTempRole) {
          await this.groupsRepository.updateRole(groupId, role.id, {
            name: role.name,
            permissions: role.permissions,
            isDefault: role.isDefault,
          });
        } else {
          const created = await this.groupsRepository.createRole(groupId, {
            name: role.name,
            permissions: role.permissions,
            isDefault: role.isDefault,
          });

          if (role.clientKey || role.id) {
            createdRolesByClientKey.set(role.clientKey ?? role.id!, created.id);
          }
        }
      }
    }

    const rolesToRemove = Array.from(new Set((removeRoleIds ?? []).map((id) => id.trim()).filter(Boolean)));
    if (rolesToRemove.length > 0) {
      if (!this.groupsRepository.deleteRole) {
        throw new Error("Repositorio nao suporta remover cargos");
      }

      for (const roleId of rolesToRemove) {
        await this.groupsRepository.deleteRole(groupId, roleId);
      }
    }

    const roleChanges = memberRoleChanges ?? [];
    if (roleChanges.length > 0) {
      if (!this.groupsRepository.assignRoleToMember) {
        throw new Error("Repositorio nao suporta atribuir cargos");
      }

      for (const roleChange of roleChanges) {
        const resolvedRoleId = roleChange.roleId?.startsWith("tmp:")
          ? (createdRolesByClientKey.get(roleChange.roleId) ?? null)
          : roleChange.roleId;

        await this.groupsRepository.assignRoleToMember(
          groupId,
          roleChange.userId,
          resolvedRoleId,
        );
      }
    }

    if (relatedGroupIds !== undefined) {
      if (!this.groupsRepository.setRelatedGroups) {
        throw new Error("Repositorio nao suporta fluxo de grupos");
      }

      await this.groupsRepository.setRelatedGroups(groupId, relatedGroupIds);
    }

    const finalGroup = await this.groupsRepository.findById(groupId);
    if (!finalGroup) {
      throw new Error("Grupo nao encontrado");
    }

    return { group: finalGroup };
  }
}
