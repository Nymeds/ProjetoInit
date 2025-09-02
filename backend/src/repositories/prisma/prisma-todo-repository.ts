import { prisma } from 'src/utils/prismaClient.js';
import type { Todo } from '@prisma/client';
import type { TodosRepository } from '../todo-repository.js';

export class PrismaTodosRepository implements TodosRepository {
  async create(data: { title: string; userId: string; groupId?: string }): Promise<Todo> {
    const todo = await prisma.todo.create({
      data: {
        ...data,
        groupId: data.groupId ?? null, 
      },
      include: { group: true }, 
    });
    return todo;
  }

  async findById(id: number): Promise<Todo | null> {
    return prisma.todo.findUnique({
      where: { id },
      include: { group: true }, 
    });
  }

  async findManyByUser(userId: string): Promise<Todo[]> {
    return prisma.todo.findMany({
      where: { userId },
      include: { group: true },
    });
  }

  async update(
    id: number,
    data: { title?: string; completed?: boolean; groupId?: string },
  ): Promise<Todo> {
    return prisma.todo.update({
      where: { id },
      data: {
        ...data,
        groupId: data.groupId ?? undefined, 
      },
      include: { group: true }, 
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.todo.delete({
      where: { id },
    });
  }
}
