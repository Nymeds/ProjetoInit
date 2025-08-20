import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AuthenticateUseCase } from '@/use-cases/auth-users/authenticate.js'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository.js'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authenticateBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { email, password } = authenticateBodySchema.parse(request.body)

  try {
    const usersRepository = new PrismaUsersRepository()
    const authenticateUseCase = new AuthenticateUseCase(usersRepository)

    const { user } = await authenticateUseCase.execute({
      email,
      password,
    })

    const token = await reply.jwtSign(
      {},
      {
        sign: {
          sub: user.id,
        },
      },
    )

    return reply.status(200).send({ token })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao autenticar' })
  }
}
