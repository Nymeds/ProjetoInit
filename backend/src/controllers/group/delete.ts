import { PrismaGroupsRepository } from "@/repositories/prisma/prisma-groups-repository.js";
import { DeleteGroupUseCase } from "@/use-cases/groups/delete.js";
import type { FastifyRequest, FastifyReply } from "fastify";

export async function deleteGroup(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;

  try {
    const repository = new PrismaGroupsRepository();
    const useCase = new DeleteGroupUseCase(repository);

    const group = await useCase.execute({ id });

    return reply.status(200).send({ message: "Grupo deletado com sucesso", group });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || "Erro ao deletar grupo" });
  }
}
