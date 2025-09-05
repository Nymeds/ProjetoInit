import { prisma } from '../../utils/prismaClient.js';
export class PrismaTodosRepository {
    async create(data) {
        return prisma.todo.create({
            data: {
                title: data.title,
                userId: data.userId,
                description: data.description ?? null,
                groupId: data.groupId ?? null,
            },
        });
    }
    async findById(id) {
        return prisma.todo.findUnique({ where: { id } });
    }
    async findManyByUser(userId, groupId) {
        const whereClause = { userId };
        if (groupId)
            whereClause.groupId = groupId;
        return prisma.todo.findMany({ where: whereClause });
    }
    async update(id, data) {
        return prisma.todo.update({
            where: { id },
            data: {
                ...data,
                groupId: data.groupId ?? null,
            },
        });
    }
    async delete(id) {
        await prisma.todo.delete({ where: { id } });
    }
    async findAllVisibleForUser(userId) {
        // Pega todos os grupos do usuário
        const userGroups = await prisma.userGroup.findMany({
            where: { userId },
            select: { groupId: true },
        });
        const groupIds = userGroups.map(g => g.groupId);
        // Retorna todas as tarefas do usuário ou do grupo
        return prisma.todo.findMany({
            where: {
                OR: [
                    { userId },
                    { groupId: { in: groupIds } },
                ],
            },
        });
    }
}
