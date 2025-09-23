import { prisma } from '../../utils/prismaClient.js';
import type { Todo } from '@prisma/client';
import type { TodosRepository } from '../todo-repository.js';

export class PrismaTodosRepository implements TodosRepository {
  async create(data: { title: string; userId: string; description?: string; groupId?: string }): Promise<Todo> {
    return prisma.todo.create({
      data: {
        title: data.title,
        userId: data.userId,
        description: data.description ?? null,
        groupId: data.groupId ?? undefined,
      },
    });
  }

  async findById(id: number): Promise<Todo | null> {
    return prisma.todo.findUnique({ where: { id } });
  }

  async findManyByUser(userId: string, groupId?: string): Promise<Todo[]> {
    const whereClause: any = { userId };
    if (groupId) whereClause.groupId = groupId;

    return prisma.todo.findMany({ where: whereClause });
  }

  async update(
    id: number,
    data: { title?: string; completed?: boolean; groupId?: string },
  ): Promise<Todo> {
    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) throw new Error("Tarefa não encontrada");

    return prisma.todo.update({
      where: { id },
      data: {
        ...data,
       
        groupId: data.groupId ?? existingTodo.groupId ?? undefined,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.todo.delete({ where: { id } });
  }

  async findAllVisibleForUser(userId: string): Promise<Todo[]> {
   
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = userGroups.map(g => g.groupId);

  
    return prisma.todo.findMany({
      where: {
        OR: [
          { userId },
          { groupId: { in: groupIds } },
        ],
      },
    });
  }

  
  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId, groupId }
      }
    });
    return !!membership;
  }
}
