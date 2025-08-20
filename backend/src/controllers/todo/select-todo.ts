import type { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaTodosRepository } from '@/repositories/prisma/prisma-todo-repository.js'
import { SelectTodosUseCase } from '@/use-cases/todo/select-todo.js'

export async function selectTodos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub // ou tipar o request.user corretamente

    const todosRepository = new PrismaTodosRepository()
    const selectTodosUseCase = new SelectTodosUseCase(todosRepository)

    const { todos } = await selectTodosUseCase.execute({ userId })

    return reply.status(200).send({ todos })
  } catch (err) {
    return reply.status(400).send({ message: 'Erro ao buscar todos' })
  }
}
