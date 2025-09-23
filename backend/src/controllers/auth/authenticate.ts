import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AuthenticateUseCase } from '../../use-cases/auth-users/authenticate.js'
import { PrismaUsersRepository } from '../../repositories/prisma/prisma-users-repository.js'

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
    const { user } = await authenticateUseCase.execute({ email, password })

    
    const accessToken = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id } }
    )
    
    const refreshToken = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id } }
    )
    
    return reply
      .setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      })
      .status(200)
      .send({ token: accessToken , refreshToken})
  } catch (err: any) {
    return reply
      .status(400)
      .send({ message: err.message || 'Erro ao autenticar' })
  }
}