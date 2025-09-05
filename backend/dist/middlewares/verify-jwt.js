export async function verifyJwt(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ message: 'Unauthorized.' });
    }
}
