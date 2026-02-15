import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../utils/prismaClient.js'

export async function listFriends(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub

    const friendships = await (prisma as any).friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        addressee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const friends = friendships.map((friendship: any) => {
      const isRequester = friendship.requesterId === userId
      const friend = isRequester ? friendship.addressee : friendship.requester
      return {
        friendshipId: friendship.id,
        id: friend.id,
        name: friend.name,
        email: friend.email,
      }
    })

    return reply.status(200).send({ friends })
  } catch (err: any) {
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
    return reply.status(400).send({ message: err?.message || 'Erro ao listar solicitacoes' })
  }
}
