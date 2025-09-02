import { PrismaGroupsRepository } from "@/repositories/prisma/prisma-groups-repository.js";
import { CreateGroupUseCase } from "@/use-cases/groups/create.js";
import type { FastifyRequest, FastifyReply } from "fastify";
import z from "zod";

export async function createGroup(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    name: z.string().min(1, 'Nome do grupo é obrigatório'),
    description: z.string().optional(),
    userEmails: z.array(z.string().email()).min(1, 'Adicione pelo menos um usuário'),
  });

  const { name, description, userEmails } = schema.parse(request.body);

  try {
    const repository = new PrismaGroupsRepository();
    const useCase = new CreateGroupUseCase(repository);

    const group = await useCase.execute({
      name,
        description: description ?? '',
      userEmails,
    });

    return reply.status(201).send(group);
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar grupo' });
  }
}
