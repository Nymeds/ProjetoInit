import { z } from 'zod';
import { PrismaUsersRepository } from '../../repositories/prisma/prisma-users-repository.js';
import { DeleteUserUseCase } from '../../use-cases/auth-users/user-delete.js';
export async function deleteUser(request, reply) {
    const paramsSchema = z.object({
        id: z.string().min(1),
    });
    const { id } = paramsSchema.parse(request.params);
    try {
        const usersRepo = new PrismaUsersRepository();
        const useCase = new DeleteUserUseCase(usersRepo);
        await useCase.execute({ targetUserId: id });
        return reply.status(204).send();
    }
    catch (err) {
        return reply.status(404).send({ message: err.message ?? 'User not found' });
    }
}
