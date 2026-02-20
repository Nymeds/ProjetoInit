import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js'
import { UpdateTodoUseCase } from '../../use-cases/todo/update-todo.js'
import { z } from 'zod'

interface UpdateTodoRequestParams {
  id: string
}

const updateTodoBodySchema = z.object({
  title: z.string(),
  groupId: z.string().nullable().optional(),
})

export async function updateTodo(
  request: FastifyRequest<{ Params: UpdateTodoRequestParams }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).sub
    const todoId = Number(request.params.id)
    const { title , groupId} = updateTodoBodySchema.parse(request.body)

    const todosRepository = new PrismaTodosRepository()
    const groupsRepository = new PrismaGroupsRepository()
    const updateUseCase = new UpdateTodoUseCase(todosRepository, groupsRepository)

    const { todo } = await updateUseCase.execute({ todoId, userId, title , groupId })

    return reply.status(200).send({ todo })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Error updating todo' })
  }
}
