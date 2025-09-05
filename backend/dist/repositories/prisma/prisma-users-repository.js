import { prisma } from '../../utils/prismaClient.js';
export class PrismaUsersRepository {
    async findById(id, options) {
        return prisma.user.findUnique({
            where: { id },
            include: options?.includeGroups
                ? {
                    groups: { include: { group: true } },
                }
                : null,
        });
    }
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    async create(data) {
        return prisma.user.create({ data });
    }
    async apagar(id) {
        await prisma.user.delete({ where: { id } });
    }
}
