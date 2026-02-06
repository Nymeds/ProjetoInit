import { prisma } from '../../utils/prismaClient.js';
import type { MessagesRepository, Message } from '../messages-repository.js';

export class PrismaMessagesRepository implements MessagesRepository {
  async listByGroup(groupId: string): Promise<Message[]> {
    const rows = await (prisma as any).message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: { author: true },
    });

    return (rows as any[]).map((r: any) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      kind: r.kind,
      authorId: r.authorId,
      authorName: r.author?.name ?? null,
      groupId: r.groupId,
      todoId: r.todoId,
    }));
  }

  async createForGroup(groupId: string, authorId: string, content: string): Promise<Message> {
    const r = await (prisma as any).message.create({
      data: {
        content,
        authorId,
        groupId,
      },
      include: { author: true },
    });

    return {
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      kind: r.kind,
      authorId: r.authorId,
      authorName: r.author?.name ?? null,
      groupId: r.groupId,
      todoId: r.todoId,
    };
  }

  async listByTodo(todoId: number, kind: 'COMMENT' | 'CHAT' = 'COMMENT'): Promise<Message[]> {
    const rows = await (prisma as any).message.findMany({
      where: { todoId, kind },
      orderBy: { createdAt: 'asc' },
      include: { author: true },
    });

    return (rows as any[]).map((r: any) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      kind: r.kind,
      authorId: r.authorId,
      authorName: r.author?.name ?? null,
      groupId: r.groupId,
      todoId: r.todoId,
    }));
  }

  async createForTodo(todoId: number, authorId: string, content: string, kind: 'COMMENT' | 'CHAT' = 'COMMENT'): Promise<Message> {
    const r = await (prisma as any).message.create({
      data: {
        content,
        authorId,
        todoId,
        kind,
      },
      include: { author: true },
    });

    return {
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      kind: r.kind,
      authorId: r.authorId,
      authorName: r.author?.name ?? null,
      groupId: r.groupId,
      todoId: r.todoId,
    };
  }

  async updateForTodo(commentId: string, authorId: string, content: string): Promise<Message> {
    const existing = await (prisma as any).message.findUnique({ where: { id: commentId }, include: { author: true } });
    if (!existing) throw new Error('Comentário não encontrado');
    if (existing.authorId !== authorId) throw new Error('Usuário não autorizado');

    const r = await (prisma as any).message.update({ where: { id: commentId }, data: { content }, include: { author: true } });

    return {
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      kind: r.kind,
      authorId: r.authorId,
      authorName: r.author?.name ?? null,
      groupId: r.groupId,
      todoId: r.todoId,
    };
  }

  async delete(commentId: string, authorId: string): Promise<void> {
    const existing = await (prisma as any).message.findUnique({ where: { id: commentId } });
    if (!existing) throw new Error('Comentário não encontrado');
    if (existing.authorId !== authorId) throw new Error('Usuário não autorizado');

    await (prisma as any).message.delete({ where: { id: commentId } });
  }
}