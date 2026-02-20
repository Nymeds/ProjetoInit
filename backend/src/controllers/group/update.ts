import type { FastifyReply, FastifyRequest } from "fastify";
import { GroupPermission } from "@prisma/client";
import { z } from "zod";
import { PrismaGroupsRepository } from "../../repositories/prisma/prisma-groups-repository.js";
import { UpdateGroupUseCase } from "../../use-cases/groups/update-group.js";

interface UpdateGroupRequestParams {
  id: string;
}

const rolePayloadSchema = z.object({
  id: z.string().min(1).optional(),
  clientKey: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(10),
  permissions: z.array(z.nativeEnum(GroupPermission)).min(1),
  isDefault: z.boolean().optional(),
});

const memberRoleChangeSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1).nullable(),
});

const updateGroupBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  addUserEmails: z.array(z.string().email()).optional(),
  removeUserIds: z.array(z.string().min(1)).optional(),
  upsertRoles: z.array(rolePayloadSchema).optional(),
  removeRoleIds: z.array(z.string().min(1)).optional(),
  memberRoleChanges: z.array(memberRoleChangeSchema).optional(),
  relatedGroupIds: z.array(z.string().min(1)).optional(),
}).refine((data) => (
  data.name !== undefined
  || data.description !== undefined
  || (data.addUserEmails?.length ?? 0) > 0
  || (data.removeUserIds?.length ?? 0) > 0
  || (data.upsertRoles?.length ?? 0) > 0
  || (data.removeRoleIds?.length ?? 0) > 0
  || (data.memberRoleChanges?.length ?? 0) > 0
  || data.relatedGroupIds !== undefined
), {
  message: "Informe campos para atualizar o grupo",
});

export async function updateGroup(
  request: FastifyRequest<{ Params: UpdateGroupRequestParams }>,
  reply: FastifyReply,
) {
  try {
    const userId = (request.user as any).sub as string;
    const groupId = request.params.id;

    const {
      name,
      description,
      addUserEmails,
      removeUserIds,
      upsertRoles,
      removeRoleIds,
      memberRoleChanges,
      relatedGroupIds,
    } = updateGroupBodySchema.parse(request.body);

    const groupsRepository = new PrismaGroupsRepository();
    const updateUseCase = new UpdateGroupUseCase(groupsRepository);

    const { group } = await updateUseCase.execute({
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
    });

    return reply.status(200).send({ group });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || "Erro ao atualizar grupo" });
  }
}
