import type { FastifyReply, FastifyRequest } from "fastify";
import { ELISA_STATE_PREFIX, INTERNAL_GROUP_ORCHESTRATION_PREFIXES } from "./config.js";
import { prisma } from "../../utils/prismaClient.js";

/**
 * Identifica mensagens tecnicas que fazem parte da orquestracao interna da ELISA.
 * Essas mensagens existem para memoria/controle, mas nao devem aparecer ao usuario.
 */
function isInternalAssistantMessage(content: string) {
  if (content.startsWith(ELISA_STATE_PREFIX)) return true;
  return INTERNAL_GROUP_ORCHESTRATION_PREFIXES.some((prefix) => content.startsWith(prefix));
}

/**
 * Retorna o historico "limpo" da conversa com a assistente.
 * O endpoint remove mensagens TOOL e sinais internos para o front receber apenas
 * o que faz sentido mostrar como conversa humana.
 */
export async function assistantHistory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub;

    // Busca a thread inteira porque a filtragem de mensagens internas e feita aqui.
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
      if (message.role === "TOOL") {
        continue;
      }

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
