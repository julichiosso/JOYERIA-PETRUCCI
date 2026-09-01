import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService, InvalidCredentialsError, InvalidRefreshTokenError } from './auth.service.js';
import type { LoginSchema  } from './auth.schema.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 días, igual al expiry del token

export const authController = {
  async login(
    request: FastifyRequest<{ Body: LoginSchema }>,
    reply: FastifyReply
  ) {
    try {
      const { tokens, user } = await authService.login(request.body);

      reply.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
      });

      return reply.status(200).send({
        accessToken: tokens.accessToken,
        user,
      });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.status(401).send({ error: 'Credenciales inválidas' });
      }
      throw err;
    }
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return reply.status(401).send({ error: 'No hay refresh token' });
    }

    try {
      const tokens = await authService.refresh(refreshToken);

      reply.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
      });

      return reply.status(200).send({ accessToken: tokens.accessToken });
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) {
        reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
        return reply.status(401).send({ error: 'Sesión expirada, iniciá sesión de nuevo' });
      }
      throw err;
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return reply.status(200).send({ message: 'Sesión cerrada' });
  },
};