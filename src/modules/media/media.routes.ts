import type { FastifyInstance } from 'fastify';
import { mediaController } from './media.controller.js';
import {
  productIdParamSchema,
  imageIdParamSchema,
  updateImageAltTextSchema,
  reorderImagesSchema,
} from './media.schema.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

export async function mediaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post(
    '/products/:productId/images',
    { schema: { params: productIdParamSchema } },
    mediaController.upload
  );

  app.patch(
    '/images/:imageId',
    { schema: { params: imageIdParamSchema, body: updateImageAltTextSchema } },
    mediaController.updateAltText
  );

  app.delete(
    '/images/:imageId',
    { schema: { params: imageIdParamSchema } },
    mediaController.delete
  );

  app.post(
    '/products/:productId/images/reorder',
    { schema: { params: productIdParamSchema, body: reorderImagesSchema } },
    mediaController.reorder
  );
}