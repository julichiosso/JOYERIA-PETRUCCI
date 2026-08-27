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
    try {
      const product = await productService.update(request.params.id, request.body);
      return reply.status(200).send(product);
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  },

  async getById(
    request: FastifyRequest<{ Params: ProductIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const product = await productService.getById(request.params.id);
      return reply.status(200).send(product);
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  },

  async delete(
    request: FastifyRequest<{ Params: ProductIdParam }>,
    reply: FastifyReply
  ) {
    try {
      await productService.delete(request.params.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  },

  async list(
    request: FastifyRequest<{ Querystring: ProductListQuery }>,
    reply: FastifyReply
  ) {
    const result = await productService.list(request.query);
    return reply.status(200).send(result);
  },

  // Catálogo público: solo trae productos disponibles, por slug
    // Catálogo público: solo trae productos disponibles, por slug
  async getPublicBySlug(
    request: FastifyRequest<{ Params: ProductSlugParam }>,
    reply: FastifyReply
  ) {
    try {
      const product = await productService.getBySlug(request.params.slug);
      if (product.status === 'DRAFT') {
        return reply.status(404).send({ error: 'Producto no encontrado' });
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
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
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
};