
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { PrismaTodosRepository } from '@/repositories/prisma/prisma-todo-repository.js'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    title : z.string(),
  })
  const userId = request.user.sub 
  const { title } = registerBodySchema.parse(request.body)

  try {
    const todoRepository = new PrismaTodosRepository()
    const createUseCase = new CreateTodoUseCase(todoRepository)

    await createUseCase.execute({
      title,
      userId,
    })

    return reply.status(201).send({ message: 'Todo registered successfully' })
  } catch (err) {
    if (err ) {
      return reply.status(409).send({ message: err})
    }

    throw err
  }
}
