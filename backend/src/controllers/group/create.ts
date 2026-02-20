import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { PrismaGroupsRepository } from "../../repositories/prisma/prisma-groups-repository.js";
import { PrismaUsersRepository } from "../../repositories/prisma/prisma-users-repository.js";
import { CreateGroupUseCase } from "../../use-cases/groups/create.js";

const createGroupBodySchema = z.object({
  name: z.string().min(1, "Nome do grupo e obrigatorio"),
  description: z.string().optional(),
  userEmails: z.array(z.string().email()).min(1, "Adicione pelo menos um usuario"),
});

export async function createGroup(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, description, userEmails } = createGroupBodySchema.parse(request.body);
    const creatorUserId = (request.user as any).sub as string;

    const groupsRepository = new PrismaGroupsRepository();
    const usersRepository = new PrismaUsersRepository();
    const useCase = new CreateGroupUseCase(groupsRepository, usersRepository);

    const group = await useCase.execute({
      name,
      description,
      userEmails,
      creatorUserId,
    });

    return reply.status(201).send(group);
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || "Erro ao criar grupo" });
  }
}

