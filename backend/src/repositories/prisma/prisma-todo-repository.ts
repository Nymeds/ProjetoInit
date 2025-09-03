import { prisma } from 'src/utils/prismaClient.js';
import type { Todo } from '@prisma/client';
import type { TodosRepository } from '../todo-repository.js';

export class PrismaTodosRepository implements TodosRepository {
  async create(data: { title: string; userId: string; groupId?: string }): Promise<Todo> {
    return prisma.todo.create({
      data: {
        ...data,
        groupId: data.groupId ?? null,
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
    return prisma.todo.update({
      where: { id },
      data: {
        ...data,
        groupId: data.groupId ?? null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.todo.delete({ where: { id } });
  }

  async findAllVisibleForUser(userId: string): Promise<Todo[]> {
    // Pega todos os grupos do usuário
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = userGroups.map(g => g.groupId);

    // Retorna todas as tarefas do usuário ou do grupo
    return prisma.todo.findMany({
      where: {
        OR: [
          { userId },
          { groupId: { in: groupIds } },
        ],
      },
    });
  }
}
