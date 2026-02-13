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
}).refine((data) => data.name !== undefined || data.description !== undefined, {
  message: 'Informe name ou description para atualizar',
})

export async function updateGroup(
  request: FastifyRequest<{ Params: UpdateGroupRequestParams }>,
  reply: FastifyReply,
) {
  try {
    const userId = (request.user as any).sub
    const groupId = request.params.id
    const { name, description } = updateGroupBodySchema.parse(request.body)

    const groupsRepository = new PrismaGroupsRepository()
    const updateUseCase = new UpdateGroupUseCase(groupsRepository)

    const { group } = await updateUseCase.execute({ groupId, userId, name, description })

    return reply.status(200).send({ group })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao atualizar grupo' })
  }
}
