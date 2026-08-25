import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { productAdminRoutes, productCatalogRoutes } from './modules/products/product.routes.js';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { authRoutes } from './modules/auth/auth.routes.js';
import { AppError } from './shared/errors/index.js';   // <-- nuevo

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(productAdminRoutes, { prefix: '/admin/products' });
  await app.register(productCatalogRoutes, { prefix: '/catalog/products' });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // ---------- Error handler global ----------  <-- nuevo, antes del return app;
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        ...(error.reason ? { reason: error.reason } : {}),
        ...(error.meta ? { ...error.meta } : {}),
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Error interno del servidor',
    });
  });

  return app;
}