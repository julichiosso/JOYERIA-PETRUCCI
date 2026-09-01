import { storeConfigRepository } from './store-config.repository.js';
import { NotFoundError } from '../../shared/errors/index.js';
import type { UpdateStoreConfigInput } from './store-config.types.js';

const DEFAULT_MESSAGE_TEMPLATE =
  'Hola! Me interesa el producto "{productName}" (${price}). Más info: {productUrl}';

export const storeConfigService = {
  async get() {
    const config = await storeConfigRepository.find();
    if (!config) {
      throw new NotFoundError('La configuración de la tienda no fue inicializada. Correr el seed primero.');
    }
    return config;
  },

  async update(input: UpdateStoreConfigInput) {
    const existing = await storeConfigRepository.find();
    if (!existing) {
      throw new NotFoundError('La configuración de la tienda no fue inicializada. Correr el seed primero.');
    }
    return storeConfigRepository.update(input);
  },

  // Genera el link de WhatsApp con el mensaje interpolado, listo para usar en el frontend.
  async buildWhatsappLink(params: { productName: string; price: string | null; productUrl: string }): Promise<string> {
    const config = await this.get();

    const template = config.whatsappMessageTemplate ?? DEFAULT_MESSAGE_TEMPLATE;

    const message = template
      .replace('{productName}', params.productName)
      .replace('{price}', params.price ?? 'Consultar')
      .replace('{productUrl}', params.productUrl);

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${config.whatsappNumber}?text=${encodedMessage}`;
  },
};