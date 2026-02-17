import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../utils/prismaClient.js'

const requestFriendSchema = z.object({
  email: z.string().email(),
})

export async function createFriendRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub
    const { email } = requestFriendSchema.parse(request.body ?? {})
    const normalizedEmail = email.trim().toLowerCase()

    const target = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    })

    if (!target) {
      return reply.status(404).send({ message: 'Usuario nao encontrado para esse email' })
    }

    if (target.id === userId) {
      return reply.status(400).send({ message: 'Nao e possivel adicionar a si mesmo' })
    }

    const existing = await (prisma as any).friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: userId },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return reply.status(409).send({ message: 'Voce ja e amigo dessa pessoa' })
      }

      if (existing.status === 'PENDING') {
        return reply.status(409).send({ message: 'Ja existe uma solicitacao pendente' })
      }
    }

    const friendship = await (prisma as any).friendship.create({
      data: {
        requesterId: userId,
        addresseeId: target.id,
        status: 'PENDING',
      },
    })

    return reply.status(201).send({
      request: {
        id: friendship.id,
        status: friendship.status,
        createdAt: friendship.createdAt,
        addressee: target,
      },
    })
  } catch (err: any) {
    return reply.status(400).send({ message: err?.message || 'Erro ao enviar solicitacao de amizade' })
  }
}

export async function acceptFriendRequest(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = (request.user as { sub: string }).sub
    const requestId = request.params.id

    const friendship = await (prisma as any).friendship.findUnique({
      where: { id: requestId },
    })

    if (!friendship) {
      return reply.status(404).send({ message: 'Solicitacao de amizade nao encontrada' })
    }

    if (friendship.addresseeId !== userId) {
      return reply.status(403).send({ message: 'Nao autorizado para aceitar esta solicitacao' })
    }

    if (friendship.status !== 'PENDING') {
      return reply.status(409).send({ message: 'Solicitacao ja processada' })
    }

    const updated = await (prisma as any).friendship.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        addressee: { select: { id: true, name: true, email: true } },
      },
    })

    return reply.status(200).send({
      friendship: {
        id: updated.id,
        status: updated.status,
        requester: updated.requester,
        addressee: updated.addressee,
      },
    })
  } catch (err: any) {
    return reply.status(400).send({ message: err?.message || 'Erro ao aceitar solicitacao' })
  }
}
