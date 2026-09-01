import type { FastifyInstance } from 'fastify';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  productListQuerySchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdParamSchema,
  reorderVariantsSchema,
} from './product.schema.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

// Rutas de administración — requieren autenticación
export async function productAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/', { schema: { body: createProductSchema } }, productController.create);

  app.get('/', { schema: { querystring: productListQuerySchema } }, productController.list);

  app.get('/:id', { schema: { params: productIdParamSchema } }, productController.getById);

  app.patch(
    '/:id',
    { schema: { params: productIdParamSchema, body: updateProductSchema } },
    productController.update
  );

  app.delete('/:id', { schema: { params: productIdParamSchema } }, productController.delete);

  // Variantes
  app.post(
    '/:id/variants',
    { schema: { params: productIdParamSchema, body: createVariantSchema } },
    productController.addVariant
  );

  app.patch(
    '/variants/:variantId',
    {
      schema: {
        params: variantIdParamSchema,
        body: updateVariantSchema,
      },
    },
    productController.updateVariant
  );

  app.delete(
    '/variants/:variantId',
    { schema: { params: variantIdParamSchema } },
    productController.deleteVariant
  );

  app.post(
    '/:id/variants/reorder',
    {
      schema: {
        params: productIdParamSchema,
        body: reorderVariantsSchema,
      },
    },
    productController.reorderVariants
  );
}

// Rutas de catálogo público — sin autenticación, solo lectura
export async function productCatalogRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { schema: { querystring: productListQuerySchema } },
    productController.listPublic
  );

  app.get(
    '/:slug',
    { schema: { params: productSlugParamSchema } },
    productController.getPublicBySlug
  );
}