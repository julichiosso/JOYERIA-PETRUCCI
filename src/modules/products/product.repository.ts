import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

const productWithRelations = {
  include: {
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    },
    images: {
      orderBy: { order: 'asc' as const },
      select: { id: true, url: true, order: true },
    },
  },
} satisfies Prisma.ProductDefaultArgs;

export const productRepository = {
  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
      ...productWithRelations,
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      ...productWithRelations,
    });
  },

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      ...productWithRelations,
    });
  },

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.product.count({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  },

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      ...productWithRelations,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  },

   async list(params: {
    categoryId?: string;
    status?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.ProductWhereInput = {
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.status !== undefined ? { status: params.status as Prisma.ProductWhereInput['status'] } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        ...productWithRelations,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },
};