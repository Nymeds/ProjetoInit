import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js';
import { PrismaMessagesRepository } from '../../repositories/prisma/prisma-messages-repository.js';
import { ListGroupMessagesUseCase } from '../../use-cases/messages/list-by-group.js';
import { CreateGroupMessageUseCase } from '../../use-cases/messages/create-for-group.js';

export async function listGroupMessages(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const groupId = (request.params as any).id as string;

    const groupsRepo = new PrismaGroupsRepository();
    const group = await groupsRepo.findById(groupId) as any;
    if (!group) return reply.status(404).send({ message: 'Grupo não encontrado' });

    const isMember = (group.members as any[]).some((m: any) => m.userId === userId);
    if (!isMember) return reply.status(403).send({ message: 'Usuário não pertence a esse grupo' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new ListGroupMessagesUseCase(messagesRepo);

    const { messages } = await useCase.execute(groupId);

    return reply.status(200).send({ messages });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao listar mensagens' });
  }
}

export async function createGroupMessage(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const groupId = (request.params as any).id as string;
    const { content } = request.body as { content?: string };

    const groupsRepo = new PrismaGroupsRepository();
    const group = await groupsRepo.findById(groupId) as any;
    if (!group) return reply.status(404).send({ message: 'Grupo não encontrado' });

    const isMember = (group.members as any[]).some((m: any) => m.userId === userId);
    if (!isMember) return reply.status(403).send({ message: 'Usuário não pertence a esse grupo' });

    const messagesRepo = new PrismaMessagesRepository();
    const useCase = new CreateGroupMessageUseCase(messagesRepo);

    const { message } = await useCase.execute({ groupId, authorId: userId, content: content ?? '' });

    // emit to socket room if available
    try {
      (request.server as any).io?.to(`group:${groupId}`).emit('group:message', message);
    } catch (err) {
      // ignore
    }

    return reply.status(201).send({ message });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar mensagem' });
  }
}