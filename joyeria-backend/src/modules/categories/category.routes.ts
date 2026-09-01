// src/modules/categories/category.routes.ts
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { categoryController } from './category.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from './category.schema.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

// ---------- Admin: protegidas con requireAuth ----------
export async function categoryAdminRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.addHook('preHandler', requireAuth);

  server.post('/', { schema: { body: createCategorySchema } }, categoryController.create);
  server.get('/', categoryController.findAllFlat);
  server.get(
    '/:id',
    { schema: { params: categoryParamsSchema } },
    categoryController.findById
  );
  server.patch(
    '/:id',
    { schema: { params: categoryParamsSchema, body: updateCategorySchema } },
    categoryController.update
  );
  server.delete(
    '/:id',
    { schema: { params: categoryParamsSchema } },
    categoryController.delete
  );
}

// ---------- Público: sin auth ----------
export async function categoryCatalogRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/', categoryController.findActiveTree);
}