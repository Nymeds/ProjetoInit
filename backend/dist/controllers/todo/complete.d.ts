import type { FastifyRequest, FastifyReply } from 'fastify';
interface CompleteTodoRequestParams {
    id: string;
}
export declare function completeTodo(request: FastifyRequest<{
    Params: CompleteTodoRequestParams;
}>, reply: FastifyReply): Promise<never>;
export {};
