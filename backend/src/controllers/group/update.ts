import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js'
import { UpdateGroupUseCase } from '../../use-cases/groups/update-group.js'

interface UpdateGroupRequestParams {
  id: string
}

const updateGroupBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  addUserEmails: z.array(z.string().email()).optional(),
  removeUserIds: z.array(z.string().min(1)).optional(),
}).refine((data) => (
  data.name !== undefined
  || data.description !== undefined
  || (data.addUserEmails?.length ?? 0) > 0
  || (data.removeUserIds?.length ?? 0) > 0
), {
  message: 'Informe campos para atualizar o grupo',
})

export async function updateGroup(
  request: FastifyRequest<{ Params: UpdateGroupRequestParams }>,
  reply: FastifyReply,
) {
  try {
    const userId = (request.user as any).sub
    const groupId = request.params.id
    const { name, description, addUserEmails, removeUserIds } = updateGroupBodySchema.parse(request.body)

    const groupsRepository = new PrismaGroupsRepository()
    const updateUseCase = new UpdateGroupUseCase(groupsRepository)

    const { group } = await updateUseCase.execute({
      groupId,
      userId,
      name,
      description,
      addUserEmails,
      removeUserIds,
    })

    return reply.status(200).send({ group })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao atualizar grupo' })
  }
}
