import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { PrismaGroupsRepository } from "../../repositories/prisma/prisma-groups-repository.js";
import { ListGroupHistoryUseCase } from "../../use-cases/groups/list-history.js";

interface HistoryParams {
  id: string;
}

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

function describeHistoryEvent(event: any) {
  const taskTitle = event.taskTitleSnapshot || event.todo?.title || "Tarefa";
  const actorName = event.actor?.name || event.actor?.email || "Usuario";

  if (event.action === "TASK_CREATED") {
    const toName = event.toGroup?.name || event.fromGroup?.name || "Sem grupo";
    return `${actorName} criou "${taskTitle}" em ${toName}`;
  }

  const fromName = event.fromGroup?.name || "Sem grupo";
  if (event.movedOutsideParentName) {
    return `${actorName} moveu "${taskTitle}" de ${fromName} para grupo fora de (${event.movedOutsideParentName})`;
  }

  const toName = event.toGroup?.name || "Sem grupo";
  return `${actorName} moveu "${taskTitle}" de ${fromName} para ${toName}`;
}

export async function listGroupHistory(
  request: FastifyRequest<{ Params: HistoryParams; Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = (request.user as any).sub as string;
    const groupId = request.params.id;
    const { limit } = historyQuerySchema.parse(request.query ?? {});

    const groupsRepository = new PrismaGroupsRepository();
    const useCase = new ListGroupHistoryUseCase(groupsRepository);
    const { history } = await useCase.execute({ groupId, userId, limit });

    const normalized = history.map((event) => ({
      ...event,
      description: describeHistoryEvent(event),
    }));

    return reply.status(200).send({ history: normalized });
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || "Erro ao carregar historico do grupo" });
  }
}

