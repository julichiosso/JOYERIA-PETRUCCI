import type { FastifyRequest, FastifyReply } from 'fastify';
import { productService, ProductNotFoundError } from './product.service.js';
import { storeConfigService } from '../store-config/store-config.service.js';
import type {
  CreateProductSchema,
  UpdateProductSchema,
  ProductIdParam,
  ProductSlugParam,
  ProductListQuery,
} from './product.schema.js';

export const productController = {
  async create(
    request: FastifyRequest<{ Body: CreateProductSchema }>,
    reply: FastifyReply
  ) {
    const product = await productService.create(request.body);
    return reply.status(201).send(product);
  },

  async update(
    request: FastifyRequest<{ Params: ProductIdParam; Body: UpdateProductSchema }>,
    reply: FastifyReply
  ) {
    const product = await productService.update(request.params.id, request.body);
    return reply.status(200).send(product);
  },

  async getById(
    request: FastifyRequest<{ Params: ProductIdParam }>,
    reply: FastifyReply
  ) {
    const product = await productService.getById(request.params.id);
    return reply.status(200).send(product);
  },

  async delete(
    request: FastifyRequest<{ Params: ProductIdParam }>,
    reply: FastifyReply
  ) {
    await productService.delete(request.params.id);
    return reply.status(204).send();
  },

  async list(
    request: FastifyRequest<{ Querystring: ProductListQuery }>,
    reply: FastifyReply
  ) {
    const result = await productService.list(request.query);
    return reply.status(200).send(result);
  },

  // Catálogo público: solo trae productos disponibles, por slug
  async getPublicBySlug(
    request: FastifyRequest<{ Params: ProductSlugParam }>,
    reply: FastifyReply
  ) {
    const product = await productService.getBySlug(request.params.slug);
    if (product.status === 'DRAFT') {
      throw new ProductNotFoundError();
    }

    const baseUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');
    const parentSlug = product.category?.parent?.slug;
    const categorySlug = product.category?.slug ?? '';
    const productPath = parentSlug
      ? `/${parentSlug}/${categorySlug}/${product.slug}`
      : `/${categorySlug}/${product.slug}`;
    const productUrl = `${baseUrl}${productPath}`;

    const whatsappLink = await storeConfigService.buildWhatsappLink({
      productName: product.name,
      price: product.price !== null ? product.price.toString() : null,
      productUrl,
    });

    return reply.status(200).send({ ...product, whatsappLink });
  },

  // Catálogo público: solo lista productos disponibles
  async listPublic(
    request: FastifyRequest<{ Querystring: Omit<ProductListQuery, 'status'> }>,
    reply: FastifyReply
  ) {
    const { categoryId, page, limit } = request.query;
    const activeItems = await productService.list({ categoryId, page, limit });
    const visibleItems = {
      ...activeItems,
      items: activeItems.items.filter((p) => p.status !== 'DRAFT'),
    };
    return reply.status(200).send(visibleItems);
  },

  // ---------- Variants (Admin) ----------
  async addVariant(
    request: FastifyRequest<{ Params: ProductIdParam; Body: import('./product.schema.js').CreateVariantSchema }>,
    reply: FastifyReply
  ) {
    const variant = await productService.addVariant(request.params.id, request.body);
    return reply.status(201).send(variant);
  },

  async updateVariant(
    request: FastifyRequest<{
      Params: import('./product.schema.js').VariantIdParam;
      Body: import('./product.schema.js').UpdateVariantSchema;
    }>,
    reply: FastifyReply
  ) {
    const variant = await productService.updateVariant(request.params.variantId, request.body);
    return reply.status(200).send(variant);
  },

  async deleteVariant(
    request: FastifyRequest<{ Params: import('./product.schema.js').VariantIdParam }>,
    reply: FastifyReply
  ) {
    await productService.deleteVariant(request.params.variantId);
    return reply.status(204).send();
  },

  async reorderVariants(
    request: FastifyRequest<{
      Params: ProductIdParam;
      Body: import('./product.schema.js').ReorderVariantsInput;
    }>,
    reply: FastifyReply
  ) {
    await productService.reorderVariants(request.params.id, request.body.variantIds);
    return reply.status(200).send({ message: 'Orden de variantes actualizado' });
  },
};