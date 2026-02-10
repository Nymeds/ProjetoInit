import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prismaClient.js';

export async function assistantHistory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub;

    // Busca o historico do usuario para manter a memoria da ELISA
    const thread = await prisma.assistantThread.findUnique({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!thread) {
      return reply.status(200).send({ threadId: null, messages: [] });
    }

    return reply.status(200).send({
      threadId: thread.id,
      messages: thread.messages,
    });
  } catch (err: any) {
    return reply.status(500).send({
      message: err?.message || 'Erro ao carregar historico da ELISA.',
    });
  }
}
