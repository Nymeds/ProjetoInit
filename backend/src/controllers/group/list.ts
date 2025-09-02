// src/controllers/groups.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaGroupsRepository } from '@/repositories/prisma/prisma-groups-repository.js';
import { ListGroupsUseCase } from '@/use-cases/groups/list-groups.js';

export async function listGroups(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).sub;
    const repository = new PrismaGroupsRepository();
    const useCase = new ListGroupsUseCase(repository);

    const { groups } = await useCase.execute(userId);

    return reply.status(200).send({ groups });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao buscar grupos' });
  }
}
