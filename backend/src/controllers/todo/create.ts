import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { PrismaTodosRepository } from '@/repositories/prisma/prisma-todo-repository.js'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    title: z.string(),
    description: z.string().optional(),
    groupId: z.string().optional(),
  })

  const { title, groupId, description } = schema.parse(request.body)
  const userId = (request.user as any).sub

  try {
    const repository = new PrismaTodosRepository()
    const useCase = new CreateTodoUseCase(repository)

    const { todo } = await useCase.execute({ title, userId, description, groupId , })

    return reply.status(201).send({ todo })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar todo' })
  }
}
