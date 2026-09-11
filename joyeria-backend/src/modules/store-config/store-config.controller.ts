import type { FastifyRequest, FastifyReply } from 'fastify';
import { storeConfigService } from './store-config.service.js';
import { auditService } from '../audit/audit.service.js';
import type { UpdateStoreConfigSchema } from './store-config.schema.js';

export const storeConfigController = {
  async get(_request: FastifyRequest, reply: FastifyReply) {
    const config = await storeConfigService.get();
    return reply.status(200).send(config);
  },

  async update(
    request: FastifyRequest<{ Body: UpdateStoreConfigSchema }>,
    reply: FastifyReply
  ) {
    const config = await storeConfigService.update(request.body);

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'CONFIG_UPDATE',
      entityType: 'StoreConfig',
      entityId: config.id,
      description: `Actualizó ajustes de la tienda (Campos: ${Object.keys(request.body).join(', ')})`,
    });

    return reply.status(200).send(config);
  },

  // Público: solo expone lo que el frontend necesita mostrar (redes, horarios, etc.)
  // NO expone whatsappMessageTemplate crudo, es un detalle interno de implementación.
  async getPublic(_request: FastifyRequest, reply: FastifyReply) {
    const config = await storeConfigService.get();
    return reply.status(200).send({
      storeName: config.storeName,
      instagramUrl: config.instagramUrl,
      facebookUrl: config.facebookUrl,
      address: config.address,
      businessHours: config.businessHours,
      returnPolicy: config.returnPolicy,
      shippingInfo: config.shippingInfo,
    });
  },
};