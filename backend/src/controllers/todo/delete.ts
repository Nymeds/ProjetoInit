import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { DeleteTodoUseCase } from '../../use-cases/todo/delete-todo.js'

interface DeleteTodoRequestParams {
  id: number
}

export async function deleteTodo(
  request: FastifyRequest<{ Params: DeleteTodoRequestParams }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).sub 
    const todoId = Number(request.params.id)

    const todosRepository = new PrismaTodosRepository()
    const deleteTodoUseCase = new DeleteTodoUseCase(todosRepository)

    await deleteTodoUseCase.execute({ todoId, userId })

    return reply.status(200).send({ message: 'Todo deleted successfully' })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Error deleting todo' })
  }
}
