import type { FastifyRequest, FastifyReply } from "fastify";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository.js";
import { GetUserProfileUseCase } from "@/use-cases/auth-users/get-user-profile.js";

export async function me(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { sub: string }).sub;

    const usersRepository = new PrismaUsersRepository();
    const getUserProfile = new GetUserProfileUseCase(usersRepository);

    const user = await getUserProfile.execute({ userId });

    return reply.send({ user });
  } catch (err: any) {
    return reply.status(404).send({ message: err.message || "Erro ao buscar usuário" });
  }
}
