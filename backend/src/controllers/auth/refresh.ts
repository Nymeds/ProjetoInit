import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

// Tipagem do body do request
const refreshBodySchema = z.object({
  refreshToken: z.string(),
});

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verifica o JWT presente nos cookies (só-cookie)
    await request.jwtVerify({ onlyCookie: true });

    // Extrai dados do usuário logado (sub e role) do token
    const { role, sub } = request.user as { sub: string; role: string };

    // Valida o body do request
    const { refreshToken } = refreshBodySchema.parse(request.body || {});

    // Aqui você pode validar se o refreshToken é válido, por enquanto só log
    console.log('Received refreshToken:', refreshToken);

    // Cria novo access token
    const token = await reply.jwtSign(
      { role },
      {
        sign: { sub },
      }
    );

    // Cria novo refresh token (7 dias)
    const newRefreshToken = await reply.jwtSign(
      { role },
      {
        sign: {
          sub,
          expiresIn: '7d',
        },
      }
    );

    // Retorna tokens e seta cookie do refresh token
    return reply
      .setCookie('refreshToken', newRefreshToken, {
        path: '/',
        secure: false, // true se estiver em HTTPS
        sameSite: true,
        httpOnly: true,
      })
      .status(200)
      .send({
        token,
        refreshToken: newRefreshToken,
      });
  } catch (err: any) {
    return reply.status(401).send({ message: err.message || 'Unauthorized.' });
  }
}
