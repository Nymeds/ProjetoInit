import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthenticateUseCase } from '../../use-cases/auth-users/authenticate.js';
import { PrismaUsersRepository } from '../../repositories/prisma/prisma-users-repository.js';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const { email, password } = schema.parse(request.body);

  try {
    const usersRepository = new PrismaUsersRepository();
    const authenticateUseCase = new AuthenticateUseCase(usersRepository);
    const { user } = await authenticateUseCase.execute({ email, password });

    // Access token curto (10min)
    const accessToken = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id, expiresIn: '10m' } }
    );

    // Refresh token longo (7 dias)
    const refreshToken = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id, expiresIn: '7d' } }
    );

    return reply
      .setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: false,
        sameSite: true,
        httpOnly: true,
      })
      .status(200)
      .send({ token: accessToken, refreshToken });

  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao autenticar' });
  }
}
