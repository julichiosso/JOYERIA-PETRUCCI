import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    authController.login
  );

  app.post('/refresh', authController.refresh);

  app.post('/logout', authController.logout);
}