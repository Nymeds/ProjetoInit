import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js';
import { ListGroupsUseCase } from '../../use-cases/groups/list-groups.js';
export async function listGroups(request, reply) {
    try {
        const userId = request.user.sub;
        const repository = new PrismaGroupsRepository();
        const useCase = new ListGroupsUseCase(repository);
        const { groups } = await useCase.execute(userId);
        return reply.status(200).send({ groups });
    }
    catch (err) {
        return reply.status(400).send({ message: err.message || 'Erro ao buscar grupos' });
    }
}
