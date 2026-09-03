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
      select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
    },
    variants: {
      orderBy: { order: 'asc' as const },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isAvailable: true,
        order: true,
      },
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
    search?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.ProductWhereInput = {
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.status !== undefined ? { status: params.status as Prisma.ProductWhereInput['status'] } : {}),
      ...(params.search ? {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { variantLabel: { contains: params.search, mode: 'insensitive' } },
        ]
      } : {}),
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

  // ---------- Images ----------
  async createImage(data: {
    productId: string;
    url: string;
    thumbnailUrl: string;
    altText: string | null;
    order: number;
  }) {
    return prisma.productImage.create({ data });
  },

  async findImageById(imageId: string) {
    return prisma.productImage.findUnique({ where: { id: imageId } });
  },

  async deleteImage(imageId: string): Promise<void> {
    await prisma.productImage.delete({ where: { id: imageId } });
  },

  async updateImageAltText(imageId: string, altText: string) {
    return prisma.productImage.update({
      where: { id: imageId },
      data: { altText },
    });
  },

  async updateImageOrder(imageId: string, order: number): Promise<void> {
    await prisma.productImage.update({
      where: { id: imageId },
      data: { order },
    });
  },

  // ---------- Variants ----------
  async createVariant(data: {
    productId: string;
    name: string;
    sku?: string | null;
    price?: number | null;
    stock?: number;
    isAvailable?: boolean;
    order?: number;
  }) {
    return prisma.productVariant.create({ data });
  },

  async findVariantById(variantId: string) {
    return prisma.productVariant.findUnique({ where: { id: variantId } });
  },

  async findVariantByName(productId: string, name: string) {
    return prisma.productVariant.findUnique({
      where: {
        productId_name: { productId, name },
      },
    });
  },

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.productVariant.count({
      where: {
        sku,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  },

  async updateVariant(variantId: string, data: Prisma.ProductVariantUpdateInput) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  },

  async deleteVariant(variantId: string): Promise<void> {
    await prisma.productVariant.delete({ where: { id: variantId } });
  },

  async updateVariantOrder(variantId: string, order: number): Promise<void> {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { order },
    });
  },
};

