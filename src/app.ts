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
import { AppError } from './shared/errors/index.js';
import { categoryAdminRoutes, categoryCatalogRoutes } from './modules/categories/category.routes.js';
import { sitemapRoutes } from './modules/catalog/sitemap.routes.js';
import multipart from '@fastify/multipart';
import { mediaRoutes } from './modules/media/media.routes.js';
import { storeConfigAdminRoutes, storeConfigCatalogRoutes } from './modules/store-config/store-config.routes.js';
import { inquiryAdminRoutes, inquiryCatalogRoutes } from './modules/inquiries/inquiry.routes.js';

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

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB por archivo
      files: 10, // máximo 10 archivos por request
    },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(productAdminRoutes, { prefix: '/admin/products' });
  await app.register(productCatalogRoutes, { prefix: '/catalog/products' });
  await app.register(categoryAdminRoutes, { prefix: '/admin/categories' });
  await app.register(categoryCatalogRoutes, { prefix: '/catalog/categories' });
  await app.register(sitemapRoutes, { prefix: '/catalog' });
  await app.register(mediaRoutes, { prefix: '/admin/media' });
  await app.register(storeConfigAdminRoutes, { prefix: '/admin/store-config' });
  await app.register(storeConfigCatalogRoutes, { prefix: '/catalog/store-config' });
  await app.register(inquiryAdminRoutes, { prefix: '/admin/inquiries' });
  await app.register(inquiryCatalogRoutes, { prefix: '/catalog/inquiries' });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

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