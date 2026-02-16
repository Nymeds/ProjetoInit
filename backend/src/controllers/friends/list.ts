import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../utils/prismaClient.js'
import { PrismaFriendsRepository } from '../../repositories/prisma/prisma-friends-repository.js'
import { ListAcceptedFriendsUseCase } from '../../use-cases/friends/list-accepted-friends.js'

export async function listFriends(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub

    const friendsRepository = new PrismaFriendsRepository()
    const useCase = new ListAcceptedFriendsUseCase(friendsRepository)
    const { friends } = await useCase.execute(userId)

    return reply.status(200).send({ friends })
  } catch (err: any) {
    request.log.error({ err }, '[friends] listFriends failed')
    return reply.status(400).send({ message: err?.message || 'Erro ao listar amigos' })
  }
}

export async function listFriendRequests(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub

    const incoming = await (prisma as any).friendship.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const outgoing = await (prisma as any).friendship.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: {
        addressee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.status(200).send({
      incoming: incoming.map((requestItem: any) => ({
        id: requestItem.id,
        createdAt: requestItem.createdAt,
        user: requestItem.requester,
      })),
      outgoing: outgoing.map((requestItem: any) => ({
        id: requestItem.id,
        createdAt: requestItem.createdAt,
        user: requestItem.addressee,
      })),
    })
  } catch (err: any) {
    request.log.error({ err }, '[friends] listFriendRequests failed')
    return reply.status(400).send({ message: err?.message || 'Erro ao listar solicitacoes' })
  }
}
