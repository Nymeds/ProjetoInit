import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js';
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js';
import { PrismaMessagesRepository } from '../../repositories/prisma/prisma-messages-repository.js';
import { ListTodoMessagesUseCase } from '../../use-cases/messages/list-by-todo.js';
import { CreateTodoMessageUseCase } from '../../use-cases/messages/create-for-todo.js';

export async function listTodoComments(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const todoId = parseInt((request.params as any).id as string, 10);

    const todosRepo = new PrismaTodosRepository();
    const todo = await todosRepo.findById(todoId);
    if (!todo) return reply.status(404).send({ message: 'Tarefa não encontrada' });

    // allow if owner or if belongs to a group where user is member
    let allowed = todo.userId === userId;
    if (!allowed && todo.groupId) {
      const groupsRepo = new PrismaGroupsRepository();
      const group = await groupsRepo.findById(todo.groupId) as any;
      allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
    }

    if (!allowed) return reply.status(403).send({ message: 'Usuário não tem acesso a esta tarefa' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new ListTodoMessagesUseCase(messagesRepo);

    const { messages } = await useCase.execute(todoId);

    return reply.status(200).send({ messages });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao listar comentários' });
  }
}

export async function createTodoComment(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const todoId = parseInt((request.params as any).id as string, 10);
    const { content } = request.body as { content?: string };

    const todosRepo = new PrismaTodosRepository();
    const todo = await todosRepo.findById(todoId);
    if (!todo) return reply.status(404).send({ message: 'Tarefa não encontrada' });

    // authorization
    let allowed = todo.userId === userId;
    if (!allowed && todo.groupId) {
      const groupsRepo = new PrismaGroupsRepository();
      const group = await groupsRepo.findById(todo.groupId) as any;
      allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
    }

    if (!allowed) return reply.status(403).send({ message: 'Usuário não tem acesso a esta tarefa' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new CreateTodoMessageUseCase(messagesRepo);

    const { message } = await useCase.execute({ todoId, authorId: userId, content: content ?? '', kind: 'COMMENT' });

    // emit to socket room
    try {
      (request.server as any).io?.to(`todo:${todoId}`).emit('todo:comment', message);
    } catch (err) {
      // ignore
    }

    return reply.status(201).send({ message });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar comentário' });
  }
}

// update comment
export async function updateTodoComment(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const todoId = parseInt((request.params as any).id as string, 10);
    const commentId = (request.params as any).commentId as string;
    const { content } = request.body as { content?: string };

    const todosRepo = new PrismaTodosRepository();
    const todo = await todosRepo.findById(todoId);
    if (!todo) return reply.status(404).send({ message: 'Tarefa não encontrada' });

    // authorization: must have access to todo
    let allowed = todo.userId === userId;
    if (!allowed && todo.groupId) {
      const groupsRepo = new PrismaGroupsRepository();
      const group = await groupsRepo.findById(todo.groupId) as any;
      allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
    }

    if (!allowed) return reply.status(403).send({ message: 'Usuário não tem acesso a esta tarefa' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new (await import('../../use-cases/messages/update-for-todo.js')).UpdateTodoMessageUseCase(messagesRepo);

    const { message } = await useCase.execute({ commentId, authorId: userId, content: content ?? '' });

    try {
      (request.server as any).io?.to(`todo:${todoId}`).emit('todo:comment_updated', message);
    } catch (err) {
      // ignore
    }

    return reply.status(200).send({ message });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao atualizar comentário' });
  }
}

// delete comment
export async function deleteTodoComment(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const todoId = parseInt((request.params as any).id as string, 10);
    const commentId = (request.params as any).commentId as string;

    const todosRepo = new PrismaTodosRepository();
    const todo = await todosRepo.findById(todoId);
    if (!todo) return reply.status(404).send({ message: 'Tarefa não encontrada' });

    // authorization: must have access to todo
    let allowed = todo.userId === userId;
    if (!allowed && todo.groupId) {
      const groupsRepo = new PrismaGroupsRepository();
      const group = await groupsRepo.findById(todo.groupId) as any;
      allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
    }

    if (!allowed) return reply.status(403).send({ message: 'Usuário não tem acesso a esta tarefa' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new (await import('../../use-cases/messages/delete-for-todo.js')).DeleteTodoMessageUseCase(messagesRepo);

    await useCase.execute({ commentId, authorId: userId });

    try {
      (request.server as any).io?.to(`todo:${todoId}`).emit('todo:comment_deleted', { id: commentId, todoId });
    } catch (err) {
      // ignore
    }

    return reply.status(204).send({});
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao deletar comentário' });
  }
}