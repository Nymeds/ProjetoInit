import { prisma } from "../../utils/prismaClient.js";
import type { GroupsRepository, CreateGroupParams } from "../groups-repository.js";
import type { Group } from "@prisma/client";

export class PrismaGroupsRepository implements GroupsRepository {
  async create({ name, description, userEmails }: CreateGroupParams): Promise<Group> {
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

  async delete({ id }: { id: string }): Promise<Group> {
    return prisma.group.delete({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  }

  async addMember(groupId: string, userEmail: string) {
    // normalize email before lookup
    const normalized = userEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) throw new Error("Usuário não encontrado");

    return prisma.userGroup.create({
      data: { groupId, userId: user.id },
    });
  }

  async removeMember(groupId: string, userId: string) {
    await prisma.userGroup.deleteMany({
      where: { groupId, userId },
    });
  }

  async findById(id: string): Promise<Group | null> {
    return prisma.group.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  }

  async findAll(): Promise<Group[]> {
    return prisma.group.findMany({
      include: { members: { include: { user: true } } },
    });
  }

  async findByName(name: string): Promise<Group | null> {
    return prisma.group.findUnique({
      where: { name },
      include: { members: { include: { user: true } } },
    });
  }

  async findManyByUser(userId: string): Promise<Group[]> {
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
