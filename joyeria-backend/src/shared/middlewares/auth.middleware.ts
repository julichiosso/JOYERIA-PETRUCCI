import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../../modules/auth/auth.service.js';
import type { JwtPayload } from '../../modules/auth/auth.types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token de acceso requerido' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = authService.verifyAccessToken(token);
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: 'Token inválido o expirado' });
  }
}