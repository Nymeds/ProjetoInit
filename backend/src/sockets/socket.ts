import type { FastifyInstance } from 'fastify';
import { PrismaGroupsRepository } from '../repositories/prisma/prisma-groups-repository.js';
import { PrismaMessagesRepository } from '../repositories/prisma/prisma-messages-repository.js';
import { CreateGroupMessageUseCase } from '../use-cases/messages/create-for-group.js';
import { CreateTodoMessageUseCase } from '../use-cases/messages/create-for-todo.js';
import {
  maybeHandleAssistantFollowUpInGroup,
  maybeHandleTaskConfirmationInGroup,
  maybePromptTaskActionInGroup,
  maybeStoreGroupSummaryMemory,
  processAssistantMentionInGroup,
  sendElisaMessageToGroup,
} from '../controllers/assistant/chat.js';

import { Server } from 'socket.io';

export function setupSocketHandlers(app: FastifyInstance) {
  // if io is already created, skip
  if ((app as any).io) return;

  // create socket.io server and attach to Fastify underlying http server
  const io = new Server(app.server as any, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://projetoinit.onrender.com'
      ],
      methods: ['GET', 'POST']
    }
  });

  (app as any).io = io;

  io.on('connection', async (socket: any) => {
    // auth via token sent in handshake (socket.handshake.auth.token)
    const token = socket.handshake?.auth?.token;
    try {
      const decoded: any = token ? await app.jwt.verify(token) : null;
      if (!decoded?.sub) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = decoded.sub;
    } catch (err) {
      socket.disconnect(true);
      return;
    }

    socket.on('join_group', (groupId: string) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave_group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('join_todo', (todoId: number) => {
      socket.join(`todo:${todoId}`);
    });

    socket.on('leave_todo', (todoId: number) => {
      socket.leave(`todo:${todoId}`);
    });

    socket.on('group:send_message', async (payload: { groupId: string; content: string }) => {
      try {
        const userId = socket.data.userId;
        const groupsRepo = new PrismaGroupsRepository();
        const group = await groupsRepo.findById(payload.groupId) as any;
        if (!group) return;
        const isMember = (group.members as any[]).some((m: any) => m.userId === userId);
        if (!isMember) return;

        const messagesRepo = new PrismaMessagesRepository();
        const useCase = new CreateGroupMessageUseCase(messagesRepo);
        const { message } = await useCase.execute({ groupId: payload.groupId, authorId: userId, content: payload.content });

        io.to(`group:${payload.groupId}`).emit('group:message', message);

        try {
          await maybeStoreGroupSummaryMemory({ groupId: payload.groupId });
        } catch (summaryErr) {
          console.error('group:summary_memory failed', summaryErr);
        }

        const shouldTriggerElisa = /\belisa\b/i.test(payload.content);
        if (shouldTriggerElisa) {
          try {
            await processAssistantMentionInGroup({
              userId,
              groupId: payload.groupId,
              rawMessage: payload.content,
              io,
            });
          } catch (assistantErr) {
            console.error('group:elisa_mention failed', assistantErr);
            await sendElisaMessageToGroup({
              groupId: payload.groupId,
              userId,
              content: `ELISA: Nao consegui executar sua solicitacao. Motivo: ${(assistantErr as any)?.message || 'erro interno'}`,
              io,
            });
          }
          return;
        }

        const handledConfirmation = await maybeHandleTaskConfirmationInGroup({
          groupId: payload.groupId,
          userId,
          content: payload.content,
          io,
        });
        if (handledConfirmation) return;

        const handledFollowUp = await maybeHandleAssistantFollowUpInGroup({
          groupId: payload.groupId,
          userId,
          content: payload.content,
          io,
        });
        if (handledFollowUp) return;

        try {
          await maybePromptTaskActionInGroup({
            groupId: payload.groupId,
            userId,
            content: payload.content,
            io,
          });
        } catch (proactiveErr) {
          console.error('group:elisa_proactive failed', proactiveErr);
          await sendElisaMessageToGroup({
            groupId: payload.groupId,
            userId,
            content: `ELISA: Deu erro ao analisar sua mensagem agora. Motivo: ${(proactiveErr as any)?.message || 'erro interno'}`,
            io,
            registerFollowUp: false,
          });
        }
      } catch (err) {
        // ignore socket errors for now
        console.error('group:send_message failed', err);
      }
    });

    socket.on('todo:send_comment', async (payload: { todoId: number; content: string }) => {
      try {
        const userId = socket.data.userId;
        const todosRepo = new (await import('../repositories/prisma/prisma-todo-repository.js')).PrismaTodosRepository();
        const todo = await todosRepo.findById(payload.todoId);
        if (!todo) return;

        // check access
        let allowed = todo.userId === userId;
        if (!allowed && todo.groupId) {
          const groupsRepo = new PrismaGroupsRepository();
          const group = await groupsRepo.findById(todo.groupId) as any;
          allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
        }
        if (!allowed) return;

        const messagesRepo = new PrismaMessagesRepository();
        const useCase = new CreateTodoMessageUseCase(messagesRepo);
        const { message } = await useCase.execute({ todoId: payload.todoId, authorId: userId, content: payload.content, kind: 'COMMENT' });

        io.to(`todo:${payload.todoId}`).emit('todo:comment', message);
      } catch (err) {
        console.error('todo:send_comment failed', err);
      }
    });

    // todo chat messages
    socket.on('todo:send_chat', async (payload: { todoId: number; content: string }) => {
      try {
        const userId = socket.data.userId;
        const todosRepo = new (await import('../repositories/prisma/prisma-todo-repository.js')).PrismaTodosRepository();
        const todo = await todosRepo.findById(payload.todoId);
        if (!todo) return;

        // check access
        let allowed = todo.userId === userId;
        if (!allowed && todo.groupId) {
          const groupsRepo = new PrismaGroupsRepository();
          const group = await groupsRepo.findById(todo.groupId) as any;
          allowed = !!group && (group.members as any[]).some((m: any) => m.userId === userId);
        }
        if (!allowed) return;

        const messagesRepo = new PrismaMessagesRepository();
        const useCase = new CreateTodoMessageUseCase(messagesRepo);
        const { message } = await useCase.execute({ todoId: payload.todoId, authorId: userId, content: payload.content, kind: 'CHAT' });

        io.to(`todo:${payload.todoId}`).emit('todo:chat_message', message);
      } catch (err) {
        console.error('todo:send_chat failed', err);
      }
    });

    // typing indicator (group)
    socket.on('group:typing', (payload: { groupId: string; typing: boolean }) => {
      const userId = socket.data.userId;
      io.to(`group:${payload.groupId}`).emit('group:typing', { userId, typing: payload.typing });
    });

    socket.on('disconnect', () => {
      // could broadcast presence update here
    });
  });
}
