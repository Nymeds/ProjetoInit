import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prismaClient.js';

const ELISA_STATE_PREFIX = 'ELISA_STATE|';
const INTERNAL_GROUP_ORCHESTRATION_PREFIXES = [
  'O usuario confirmou a execucao de uma tarefa no grupo.',
  'Continuacao de conversa no grupo.',
];

function isInternalAssistantMessage(content: string) {
  if (content.startsWith(ELISA_STATE_PREFIX)) return true;
  return INTERNAL_GROUP_ORCHESTRATION_PREFIXES.some((prefix) => content.startsWith(prefix));
}

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

    const visibleMessages = [];
    let suppressNextAssistant = false;

    for (const message of thread.messages) {
      if (isInternalAssistantMessage(message.content)) {
        suppressNextAssistant = true;
        continue;
      }

      if (suppressNextAssistant && message.role === 'ASSISTANT') {
        continue;
      }

      if (message.role === 'USER') {
        suppressNextAssistant = false;
      }

      if (message.role === 'ASSISTANT') {
        suppressNextAssistant = false;
      }

      visibleMessages.push(message);
    }

    return reply.status(200).send({
      threadId: thread.id,
      messages: visibleMessages,
    });
  } catch (err: any) {
    return reply.status(500).send({
      message: err?.message || 'Erro ao carregar historico da ELISA.',
    });
  }
}
