import type { FastifyRequest, FastifyReply } from "fastify";
export declare function deleteGroup(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
