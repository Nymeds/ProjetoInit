import type { FastifyReply, FastifyRequest } from 'fastify'

export function verifyUserRole(requiredRole: 'ADMIN' | 'MEMBER') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user?.role
    if (userRole !== requiredRole) {
      return reply.status(403).send({ message: 'Forbidden.' })
    }
  }
}
