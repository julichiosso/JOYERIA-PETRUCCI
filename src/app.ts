import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { authRoutes } from './modules/auth/auth.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: true, // ajustar a dominios específicos cuando tengamos el frontend definido
    credentials: true, // necesario para que las cookies viajen cross-origin
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(authRoutes, { prefix: '/auth' });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}