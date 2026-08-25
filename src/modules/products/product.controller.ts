import type { FastifyRequest, FastifyReply } from 'fastify';
import { productService, ProductNotFoundError } from './product.service.js';
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
  async getPublicBySlug(
    request: FastifyRequest<{ Params: ProductSlugParam }>,
    reply: FastifyReply
  ) {
    try {
      const product = await productService.getBySlug(request.params.slug);
      if (!product.available) {
        return reply.status(404).send({ error: 'Producto no encontrado' });
      }
      return reply.status(200).send(product);
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  },

  // Catálogo público: solo lista productos disponibles
  async listPublic(
    request: FastifyRequest<{ Querystring: ProductListQuery }>,
    reply: FastifyReply
  ) {
    const result = await productService.list({ ...request.query, available: true });
    return reply.status(200).send(result);
  },
};