import type { FastifyRequest, FastifyReply } from 'fastify';
interface UpdateTodoRequestParams {
    id: string;
}
export declare function updateTodo(request: FastifyRequest<{
    Params: UpdateTodoRequestParams;
}>, reply: FastifyReply): Promise<never>;
export {};
