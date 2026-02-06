import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js';
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js';
import { PrismaMessagesRepository } from '../../repositories/prisma/prisma-messages-repository.js';
import { ListTodoMessagesUseCase } from '../../use-cases/messages/list-by-todo.js';
import { CreateTodoMessageUseCase } from '../../use-cases/messages/create-for-todo.js';

export async function listTodoChat(request: FastifyRequest, reply: FastifyReply) {
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

    const { messages } = await useCase.execute(todoId, 'CHAT');

    return reply.status(200).send({ messages });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao listar chat da tarefa' });
  }
}

export async function createTodoChat(request: FastifyRequest, reply: FastifyReply) {
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

    const { message } = await useCase.execute({ todoId, authorId: userId, content: content ?? '', kind: 'CHAT' });

    // emit to socket room
    try {
      (request.server as any).io?.to(`todo:${todoId}`).emit('todo:chat_message', message);
    } catch (err) {
      // ignore
    }

    return reply.status(201).send({ message });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar chat da tarefa' });
  }
}
