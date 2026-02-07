import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { SelectTodosUseCase } from '../../use-cases/todo/select-todo.js'

export async function selectTodos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub 
    const protocol = (request.headers['x-forwarded-proto'] as string) || request.protocol
    const host = (request.headers['x-forwarded-host'] as string) || request.headers.host
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3333'

    const todosRepository = new PrismaTodosRepository()
    const selectTodosUseCase = new SelectTodosUseCase(todosRepository)

    const { todos } = await selectTodosUseCase.execute({ userId })

    const todosWithImages = todos.map((todo) => ({
      ...todo,
      images: todo.images.map((image) => ({
        ...image,
        url: `${baseUrl}/uploads/${image.filename}`,
      })),
    }));

    return reply.status(200).send({ todos: todosWithImages })
  } catch (err) {
    return reply.status(400).send({ message: 'Erro ao buscar todos' })
  }
}
