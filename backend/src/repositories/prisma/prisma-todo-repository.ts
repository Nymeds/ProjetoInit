
import { prisma } from 'src/utils/prismaClient.js';
import type { Todo } from '@prisma/client'
import type { TodosRepository } from '../todo-repository.js'

export class PrismaTodosRepository implements TodosRepository {
  async create(data: { title: string; userId: string }): Promise<Todo> {
    const todo = await prisma.todo.create({
      data,
    })
    return todo
  }

  async findById(id: number): Promise<Todo | null> {
    return prisma.todo.findUnique({
      where: { id },
    })
  }

  async findManyByUser(userId: string): Promise<Todo[]> {
    return prisma.todo.findMany({
      where: { userId },
    })
  }

  async update(
    id: number,
    data: { title?: string; completed?: boolean },
  ): Promise<Todo> {
    return prisma.todo.update({
      where: { id },
      data,
    })
  }

  async delete(id: number): Promise<void> {
    await prisma.todo.delete({
      where: { id },
    })
  }
}
