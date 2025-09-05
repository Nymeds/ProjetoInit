export function verifyUserRole(requiredRole) {
    return async (request, reply) => {
        const userRole = request.user?.role;
        if (userRole !== requiredRole) {
            return reply.status(403).send({ message: 'Forbidden.' });
        }
    };
}
