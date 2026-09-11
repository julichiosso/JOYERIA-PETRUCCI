import type { FastifyRequest, FastifyReply } from 'fastify';
import { productService, ProductNotFoundError } from './product.service.js';
import { storeConfigService } from '../store-config/store-config.service.js';
import { auditService } from '../audit/audit.service.js';
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

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product.id,
      description: `Creó la joya "${product.name}" (${product.status}${product.price ? `, $${product.price}` : ''})`,
    });

    return reply.status(201).send(product);
  },

  async update(
    request: FastifyRequest<{ Params: ProductIdParam; Body: UpdateProductSchema }>,
    reply: FastifyReply
  ) {
    const product = await productService.update(request.params.id, request.body);

    const user = (request as any).user;
    const changedKeys = Object.keys(request.body).join(', ');
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product.id,
      description: `Modificó la joya "${product.name}" [Campos: ${changedKeys}]`,
    });

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
    const user = (request as any).user;
    await productService.delete(request.params.id);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: request.params.id,
      description: `Eliminó el producto ID: ${request.params.id}`,
    });

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

  async listPublic(
    request: FastifyRequest<{ Querystring: ProductListQuery }>,
    reply: FastifyReply
  ) {
    const result = await productService.list({
      ...request.query,
      status: 'ACTIVE',
      includeSubcategories: request.query.includeSubcategories,
    });
    const visibleItems = {
      ...result,
      items: result.items.map((product: any) => ({
        ...product,
        price: product.showPrice ? product.price : null,
      })),
    };
    return reply.status(200).send(visibleItems);
  },

  // ---------- Variants (Admin) ----------
  async addVariant(
    request: FastifyRequest<{ Params: ProductIdParam; Body: import('./product.schema.js').CreateVariantSchema }>,
    reply: FastifyReply
  ) {
    const variant = await productService.addVariant(request.params.id, request.body);

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'VARIANT_CREATE',
      entityType: 'Variant',
      entityId: variant.id,
      description: `Agregó la variante "${variant.name}" (Stock: ${variant.stock}) al producto ID: ${request.params.id}`,
    });

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

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'VARIANT_UPDATE',
      entityType: 'Variant',
      entityId: variant.id,
      description: `Actualizó la variante "${variant.name}" (Stock: ${variant.stock}, Disp: ${variant.isAvailable ? 'Sí' : 'No'})`,
    });

    return reply.status(200).send(variant);
  },

  async deleteVariant(
    request: FastifyRequest<{ Params: import('./product.schema.js').VariantIdParam }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    await productService.deleteVariant(request.params.variantId);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'VARIANT_DELETE',
      entityType: 'Variant',
      entityId: request.params.variantId,
      description: `Eliminó la variante ID: ${request.params.variantId}`,
    });

    return reply.status(204).send();
  },

  async reorderVariants(
    request: FastifyRequest<{
      Params: ProductIdParam;
      Body: import('./product.schema.js').ReorderVariantsInput;
    }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    await productService.reorderVariants(request.params.id, request.body.variantIds);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'VARIANT_REORDER',
      entityType: 'Variant',
      entityId: request.params.id,
      description: `Reordenó las variantes del producto ID: ${request.params.id}`,
    });

    return reply.status(200).send({ message: 'Orden de variantes actualizado' });
  },
};