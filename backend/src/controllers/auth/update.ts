import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '../../utils/prismaClient.js'

const updateUserBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
}).refine((data) => data.name !== undefined || data.email !== undefined || data.password !== undefined, {
  message: 'Informe name, email ou password para atualizar',
})

export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub
  const payload = updateUserBodySchema.parse(request.body ?? {})

  const nextEmail = payload.email?.trim().toLowerCase()
  const nextName = payload.name?.trim()
  const nextPassword = payload.password

  try {
    if (nextEmail) {
      const sameEmailUser = await prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      })

      if (sameEmailUser && sameEmailUser.id !== userId) {
        return reply.status(409).send({ message: 'Email ja esta em uso' })
      }
    }

    const passwordHash = nextPassword ? await hash(nextPassword, 6) : undefined

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        ...(passwordHash !== undefined ? { password: passwordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return reply.status(200).send({ user: updated })
  } catch (err: any) {
    return reply.status(400).send({ message: err?.message || 'Erro ao atualizar usuario' })
  }
}

