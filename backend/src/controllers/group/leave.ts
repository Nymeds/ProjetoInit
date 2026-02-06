import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js'
import { LeaveGroupUseCase } from '../../use-cases/groups/leave.js'

interface Params {
  id: string
}

export async function leaveGroup(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).sub
    const groupId = request.params.id

    const repo = new PrismaGroupsRepository()
    const useCase = new LeaveGroupUseCase(repo)

    await useCase.execute({ groupId, userId })

    return reply.status(200).send({ message: 'Saída do grupo realizada' })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao sair do grupo' })
  }
}
