import { prisma } from '../../infra/prisma.js';
import type { UpdateStoreConfigInput } from './store-config.types.js';

const TENANT_ID = 'default';

export const storeConfigRepository = {
  async find() {
    return prisma.storeConfig.findUnique({ where: { tenantId: TENANT_ID } });
  },

  async update(data: UpdateStoreConfigInput) {
    return prisma.storeConfig.update({
      where: { tenantId: TENANT_ID },
      data,
    });
  },
};