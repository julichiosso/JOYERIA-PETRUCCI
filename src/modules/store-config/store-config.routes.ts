import type { FastifyInstance } from 'fastify';
import { storeConfigController } from './store-config.controller.js';
import { updateStoreConfigSchema } from './store-config.schema.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

// Rutas de administración — requieren autenticación
export async function storeConfigAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', storeConfigController.get);

  app.patch('/', { schema: { body: updateStoreConfigSchema } }, storeConfigController.update);
}

// Ruta pública — solo lectura, datos no sensibles
export async function storeConfigCatalogRoutes(app: FastifyInstance) {
  app.get('/', storeConfigController.getPublic);
}