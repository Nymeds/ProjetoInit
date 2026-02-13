import type { FastifyInstance } from "fastify";
import { register } from '../controllers/auth/register.js';
import { create } from '../controllers/todo/create.js';
import { verifyJwt } from "../middlewares/verify-jwt.js";
import { authenticate } from "../controllers/auth/authenticate.js";
import { selectTodos } from '../controllers/todo/select-todo.js';
import { deleteTodo } from "../controllers/todo/delete.js";
import { updateTodo } from "../controllers/todo/update-todo.js";
import { completeTodo } from "../controllers/todo/complete.js";
import { refresh } from "../controllers/auth/refresh.js";
import { deleteUser } from "../controllers/auth/delete.js";
import { verifyUserRole } from "../middlewares/verify-user-role.js";
import { createGroup } from "../controllers/group/create.js";
import { leaveGroup } from "../controllers/group/leave.js";
import { me } from "../controllers/auth/auth-me.js";
import { listGroups } from "../controllers/group/list.js";
import { deleteGroup } from "../controllers/group/delete.js";
import { updateGroup } from "../controllers/group/update.js";
import { uploadImage } from "../middlewares/upload-images.js";
import { assistantChat } from "../controllers/assistant/chat.js";
import { assistantHistory } from "../controllers/assistant/history.js";

export async function appRoutes(app: FastifyInstance) {
  // Auth
  app.post('/users', register);
  app.post('/sessions', authenticate);
  app.patch('/token/refresh', refresh);
  app.get('/sessions/me', { preHandler: [verifyJwt] }, me);

  // ELISA (assistente virtual)
  app.get('/assistant/history', { preHandler: [verifyJwt] }, assistantHistory);
  app.post('/assistant/chat', { preHandler: [verifyJwt] }, assistantChat);

  // Todos
  app.post('/todo', { preHandler: [verifyJwt, uploadImage] }, create);
  app.get('/todo', { preHandler: [verifyJwt] }, selectTodos); 
  app.delete<{ Params: { id: number } }>('/todo/:id', { preHandler: [verifyJwt] }, deleteTodo);
  app.put<{ Params: { id: string } }>('/todo/:id', { preHandler: [verifyJwt] }, updateTodo);
  app.patch<{ Params: { id: string } }>('/todo/:id/complete', { preHandler: [verifyJwt] }, completeTodo);

  // Users (admin)
  app.delete<{ Params: { id: string } }>(
    '/users/:id',
    { preHandler: [verifyJwt, verifyUserRole('ADMIN')] },
    deleteUser
  );

  // Groups
  app.post('/groups', { preHandler: [verifyJwt, uploadImage] }, createGroup);
  app.get('/groups', { preHandler: [verifyJwt] }, listGroups);
  app.put<{ Params: { id: string } }>('/groups/:id', { preHandler: [verifyJwt] }, updateGroup);
  app.delete<{ Params: { id: string } }>('/groups/:id', { preHandler: [verifyJwt] }, deleteGroup);
  app.delete<{ Params: { id: string } }>('/groups/:id/leave', { preHandler: [verifyJwt] }, leaveGroup);

  // Messages / Comments
  app.get<{ Params: { id: string } }>('/groups/:id/messages', { preHandler: [verifyJwt] }, (await import('../controllers/group/messages.js')).listGroupMessages);
  app.post<{ Params: { id: string } }>(
  '/groups/:id/messages',
  {
    preHandler: [verifyJwt, uploadImage],
  },
  (await import('../controllers/group/messages.js')).createGroupMessage
);

  app.get<{ Params: { id: number } }>('/todo/:id/comments', { preHandler: [verifyJwt] }, (await import('../controllers/todo/comments.js')).listTodoComments);
  app.post<{ Params: { id: number } }>(
  '/todo/:id/comments',
  {
    preHandler: [verifyJwt, uploadImage],
  },
  (await import('../controllers/todo/comments.js')).createTodoComment
);
app.put<{ Params: { id: number; commentId: string } }>('/todo/:id/comments/:commentId', { preHandler: [verifyJwt] }, (await import('../controllers/todo/comments.js')).updateTodoComment);
  app.delete<{ Params: { id: number; commentId: string } }>('/todo/:id/comments/:commentId', { preHandler: [verifyJwt] }, (await import('../controllers/todo/comments.js')).deleteTodoComment);

  // todo chat (separate from comments)
  app.get<{ Params: { id: number } }>('/todo/:id/chat', { preHandler: [verifyJwt] }, (await import('../controllers/todo/chat.js')).listTodoChat);
 app.post<{ Params: { id: number } }>(
  '/todo/:id/chat',
  {
    preHandler: [verifyJwt, uploadImage],
  },
  (await import('../controllers/todo/chat.js')).createTodoChat
);
}

