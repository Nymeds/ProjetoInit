import type { FastifyRequest, FastifyReply } from 'fastify';
interface DeleteTodoRequestParams {
    id: number;
}
export declare function deleteTodo(request: FastifyRequest<{
    Params: DeleteTodoRequestParams;
}>, reply: FastifyReply): Promise<never>;
export {};
