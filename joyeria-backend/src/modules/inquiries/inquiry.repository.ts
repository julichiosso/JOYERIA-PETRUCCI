// src/modules/inquiries/inquiry.repository.ts
import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

const TENANT_ID = 'default';

export const inquiryRepository = {
  async create(data: {
    productId?: string | null;
    variantId?: string | null;
    productName: string;
    variantName?: string | null;
    priceSnapshot?: number | Prisma.Decimal | null;
  }) {
    return prisma.inquiry.create({
      data: {
        tenantId: TENANT_ID,
        productId: data.productId ?? null,
        variantId: data.variantId ?? null,
        productName: data.productName,
        variantName: data.variantName ?? null,
        priceSnapshot: data.priceSnapshot !== undefined && data.priceSnapshot !== null ? data.priceSnapshot : null,
      },
    });
  },

  async list(params: {
    productId?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.InquiryWhereInput = {
      tenantId: TENANT_ID,
      ...(params.productId ? { productId: params.productId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inquiry.count({ where }),
    ]);

    return { items, total };
  },

  async countTotal() {
    return prisma.inquiry.count({ where: { tenantId: TENANT_ID } });
  },

  async getTopProducts(limit = 5) {
    const grouped = await prisma.inquiry.groupBy({
      by: ['productId', 'productName'],
      where: { tenantId: TENANT_ID },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return grouped.map((g) => ({
      productId: g.productId,
      productName: g.productName,
      inquiryCount: g._count.id,
    }));
  },
};
