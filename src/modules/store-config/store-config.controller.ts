import type { FastifyRequest, FastifyReply } from 'fastify';
import { storeConfigService } from './store-config.service.js';
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