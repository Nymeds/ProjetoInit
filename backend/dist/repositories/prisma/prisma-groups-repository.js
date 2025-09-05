import { prisma } from "../../utils/prismaClient.js";
export class PrismaGroupsRepository {
    async create({ name, description, userEmails }) {
        const users = await prisma.user.findMany({
            where: { email: { in: userEmails } },
        });
        if (users.length === 0) {
            throw new Error("Nenhum usuário encontrado com os emails fornecidos");
        }
        return prisma.group.create({
            data: {
                name,
                description: description ?? null,
                members: {
                    create: users.map((user) => ({ userId: user.id })),
                },
            },
            include: { members: { include: { user: true } } },
        });
    }
    async delete({ id }) {
        return prisma.group.delete({
            where: { id },
            include: { members: { include: { user: true } } },
        });
    }
    async addMember(groupId, userEmail) {
        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user)
            throw new Error("Usuário não encontrado");
        return prisma.userGroup.create({
            data: { groupId, userId: user.id },
        });
    }
    async findById(id) {
        return prisma.group.findUnique({
            where: { id },
            include: { members: { include: { user: true } } },
        });
    }
    async findAll() {
        return prisma.group.findMany({
            include: { members: { include: { user: true } } },
        });
    }
    async findByName(name) {
        return prisma.group.findUnique({
            where: { name },
            include: { members: { include: { user: true } } },
        });
    }
    async findManyByUser(userId) {
        return prisma.group.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: { members: { include: { user: true } } },
        });
    }
}
