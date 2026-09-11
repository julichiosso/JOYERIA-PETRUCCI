import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { env } from './config/env.js';
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
import { auditAdminRoutes } from './modules/audit/audit.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    // CSP deshabilitado para API — el frontend lo maneja con Next.js
    contentSecurityPolicy: false,
    // HSTS: fuerza HTTPS en producción
    strictTransportSecurity: env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // CORS: solo se admiten los orígenes conocidos
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Requests sin origen (curl, Postman, server-to-server) son aceptados
      if (!origin) return cb(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
      cb(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  });
  await app.register(cookie);

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB máximo por archivo
      files: 10,
    },
  });

  // Rate limit global: 200 req/min. Las rutas sensibles tienen su propio override.
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      error: `Demasiadas solicitudes — intentá de nuevo en ${Math.ceil(context.ttl / 1000)}s`,
    }),
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
  await app.register(auditAdminRoutes, { prefix: '/admin/audit-logs' });

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
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  });

  return app;
}