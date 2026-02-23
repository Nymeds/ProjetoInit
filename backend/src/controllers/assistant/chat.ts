import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { buildErrorId, extractErrorDetails, toSafeJson } from "./helpers.js";
import {
  maybeHandleAssistantFollowUpInGroup,
  maybeHandleTaskConfirmationInGroup,
  maybePromptTaskActionInGroup,
  maybeStoreGroupSummaryMemory,
  processAssistantMentionInGroup,
  processAssistantMessage,
  sendElisaMessageToGroup,
} from "./service.js";

const chatBodySchema = z.object({
  message: z.string().min(1, "Mensagem obrigatoria"),
  groupId: z.string().min(1).optional(),
  autoPostToGroup: z.boolean().optional(),
});

export async function assistantChat(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { message, groupId, autoPostToGroup } = chatBodySchema.parse(request.body || {});
    const userId = ((request as any).user as { sub: string }).sub;

    const result = await processAssistantMessage({
      userId,
      message,
      sourceGroupId: groupId,
      autoPostToSourceGroup: autoPostToGroup ?? false,
      io: (request.server as any).io,
    });

    return reply.status(200).send(result);
  } catch (err: any) {
    const errorId = buildErrorId("assistant_chat_error");
    console.error("[assistant:chat:failed]", {
      errorId,
      userId: ((request as any).user as { sub?: string } | undefined)?.sub,
      body: toSafeJson(request.body),
      error: extractErrorDetails(err),
    });

    return reply.status(500).send({
      message: err?.message || "Erro ao conversar com a ELISA.",
      errorId,
    });
  }
}

export {
  maybeHandleAssistantFollowUpInGroup,
  maybeHandleTaskConfirmationInGroup,
  maybePromptTaskActionInGroup,
  maybeStoreGroupSummaryMemory,
  processAssistantMentionInGroup,
  processAssistantMessage,
  sendElisaMessageToGroup,
};
