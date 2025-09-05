import type { FastifyReply, FastifyRequest } from 'fastify';
export declare function verifyUserRole(requiredRole: 'ADMIN' | 'MEMBER'): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
