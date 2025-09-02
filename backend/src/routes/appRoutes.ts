import type { FastifyInstance } from "fastify";
import { register } from '../controllers/auth/register.js'
import { create } from '../controllers/todo/create.js'
import { verifyJwt } from "@/middlewares/verify-jwt.js";
import { authenticate } from "@/controllers/auth/authenticate.js";
import { selectTodos } from "@/controllers/todo/select-todo.js";
import { deleteTodo } from "@/controllers/todo/delete.js";
import { updateTodo } from "@/controllers/todo/update-todo.js";
import { completeTodo } from "@/controllers/todo/complete.js";
import { refresh } from "@/controllers/auth/refresh.js";
import { deleteUser } from "@/controllers/auth/delete.js";
import { verifyUserRole } from "@/middlewares/verify-user-role.js";
import { createGroup } from "@/controllers/group/create.js";
import { me } from "@/controllers/auth/auth-me.js";
import { listGroups } from "@/controllers/group/list.js";
export async function appRoutes(app:FastifyInstance){
    
    app.post('/users',register)
    app.post('/sessions', authenticate)
    app.patch('/token/refresh', refresh)
    app.get("/sessions/me", { preHandler: [verifyJwt] }, me);
    app.post('/todo', { preHandler: [verifyJwt] }, create)
    app.get('/todo', { preHandler: [verifyJwt] }, selectTodos)
    app.delete<{ Params: { id: number  } }>('/todo/:id',{ preHandler: [verifyJwt] },deleteTodo)
    app.put<{ Params: { id: string } }>('/todo/:id', { preHandler: [verifyJwt] }, updateTodo)
    app.patch<{ Params: { id: string } }>('/todo/:id/complete', { preHandler: [verifyJwt] }, completeTodo)
    app.delete<{ Params: { id: string } }>(
        '/users/:id',
        { preHandler: [verifyJwt, verifyUserRole('ADMIN')] },
        deleteUser
      )
    app.post('/groups', { preHandler: [verifyJwt] }, createGroup);
    app.get('/groups', { preHandler: [verifyJwt] }, listGroups);

  }
