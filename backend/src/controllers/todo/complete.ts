import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { CompleteTodoUseCase } from '../../use-cases/todo/complete-todo.js'

interface CompleteTodoRequestParams {
  id: string
}

export async function completeTodo(
  request: FastifyRequest<{ Params: CompleteTodoRequestParams }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).sub
    const todoId = Number(request.params.id)

    const todosRepository = new PrismaTodosRepository()
    const completeUseCase = new CompleteTodoUseCase(todosRepository)

    const { todo } = await completeUseCase.execute({ todoId, userId })

    return reply.status(200).send({ todo })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Error completing todo' })
  }
}
