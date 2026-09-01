// src/modules/inquiries/inquiry.routes.ts
import type { FastifyInstance } from 'fastify';
import { inquiryController } from './inquiry.controller.js';
import { createInquirySchema, inquiryListQuerySchema } from './inquiry.schema.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

// Rutas de administración — requieren autenticación
export async function inquiryAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', { schema: { querystring: inquiryListQuerySchema } }, inquiryController.list);
  app.get('/stats', inquiryController.stats);
}

// Rutas de catálogo público — sin autenticación, con rate limit por IP
export async function inquiryCatalogRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: { body: createInquirySchema },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    inquiryController.create
  );
}
