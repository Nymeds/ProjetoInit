import type { FastifyReply, FastifyRequest } from "fastify";
import { PrismaGroupsRepository } from "../../repositories/prisma/prisma-groups-repository.js";
import { DeleteGroupUseCase } from "../../use-cases/groups/delete.js";

export async function deleteGroup(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params;
    const requesterUserId = (request.user as any).sub as string;

    const repository = new PrismaGroupsRepository();
    const useCase = new DeleteGroupUseCase(repository);
    const group = await useCase.execute({ id, requesterUserId });

    return reply.status(200).send({ message: "Grupo deletado com sucesso", group });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || "Erro ao deletar grupo" });
  }
}

