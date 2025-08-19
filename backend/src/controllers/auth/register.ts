import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

import { RegisterUseCase } from 'src/use-cases/auth/register.js'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository.js'

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { name, email, password } = registerBodySchema.parse(request.body)

  try {
    const usersRepository = new PrismaUsersRepository()
    const registerUseCase = new RegisterUseCase(usersRepository)

    await registerUseCase.execute({
      name,
      email,
      password,
    })

    return reply.status(201).send({ message: 'User registered successfully' })
  } catch (err) {
    if (err ) {
      return reply.status(409).send({ message: err})
    }

    throw err
  }
}
