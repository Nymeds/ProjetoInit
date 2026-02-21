import { email } from 'zod';
import { prisma } from '../../utils/prismaClient.js';
import type { UsersRepository } from '../users-repository.js';

export class PrismaUsersRepository implements UsersRepository {
  async findById(id: string, options?: { includeGroups?: boolean }) {
    return prisma.user.findUnique({
      where: { id },
      include: options?.includeGroups
        ? {
            groups: { include: { group: true } },
          }
        : null,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: { name:string; email: string; password: string }) {
    return prisma.user.create({ data });
  }

  async apagar(id: string) {
    await prisma.user.delete({ where: { id } });
  }
  async updateResetToken(
  userId: string,
  token: string,
  expires: Date
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    },
  });
}

  async findByResetToken(token: string) {
  return prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(), // ainda não expirou
      },
    },
  });
}

}
