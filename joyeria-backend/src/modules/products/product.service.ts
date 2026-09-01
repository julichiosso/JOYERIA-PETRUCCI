import { productRepository } from './product.repository.js';
import { slugify } from '../../shared/utils/slugify.js';
import { withSeoFallbacks, buildJsonLd } from './product.seo.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors/index.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from './product.types.js';

export class ProductNotFoundError extends NotFoundError {
  constructor(message = 'Producto no encontrado') {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name);
  let candidateSlug = baseSlug;
  let counter = 1;

  while (await productRepository.slugExists(candidateSlug, excludeId)) {
    counter += 1;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}

import { getPublicUrl } from '../../infra/storage/storage.service.js';

function formatProductImages<T extends { images: { id: string; url: string; thumbnailUrl: string | null; altText: string | null; order: number }[] }>(product: T): T {
  return {
    ...product,
    images: product.images.map((img) => ({
      ...img,
      url: getPublicUrl(img.url),
      thumbnailUrl: img.thumbnailUrl ? getPublicUrl(img.thumbnailUrl) : null,
    })),
  };
}

export const productService = {
  async create(input: CreateProductInput) {
    const slug = await generateUniqueSlug(input.name);

    const product = await productRepository.create({
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      status: input.status,
      showPrice: input.showPrice,
      variantLabel: input.variantLabel,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      category: { connect: { id: input.categoryId } },
    });

    return formatProductImages(product);
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    const slug = input.name ? await generateUniqueSlug(input.name, id) : undefined;

    const updated = await productRepository.update(id, {
      ...(input.name ? { name: input.name, slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.showPrice !== undefined ? { showPrice: input.showPrice } : {}),
      ...(input.variantLabel !== undefined ? { variantLabel: input.variantLabel } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
    });

    return formatProductImages(updated);
  },

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return formatProductImages(product);
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const formattedProduct = formatProductImages(product);

    // Si el dueño no habilitó mostrar el precio, lo ocultamos del todo
    // en la respuesta pública — no solo "no se muestra en el frontend",
    // el dato real ni siquiera viaja en el JSON (incluyendo variantes).
    const productForPublic = formattedProduct.showPrice
      ? formattedProduct
      : {
          ...formattedProduct,
          price: null,
          variants: formattedProduct.variants.map((v) => ({ ...v, price: null })),
        };

    const withMeta = withSeoFallbacks(productForPublic);
    const jsonLd = buildJsonLd(productForPublic, withMeta);
    return { ...withMeta, jsonLd };
  },

  async delete(id: string): Promise<void> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }
    await productRepository.delete(id);
  },

  async list(params: { categoryId?: string; status?: string; page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const { items, total } = await productRepository.list({
      categoryId: params.categoryId,
      status: params.status,
      skip,
      take: params.limit,
    });

    return {
      items: items.map((item) => formatProductImages(item)),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },

  // ---------- Variants ----------
  async addVariant(productId: string, input: CreateVariantInput) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const existingName = await productRepository.findVariantByName(productId, input.name);
    if (existingName) {
      throw new ConflictError(
        `Ya existe una variante con el nombre "${input.name}" en este producto`,
        { reason: 'DUPLICATE_VARIANT_NAME' }
      );
    }

    if (input.sku) {
      const skuTaken = await productRepository.skuExists(input.sku);
      if (skuTaken) {
        throw new ConflictError(`El SKU "${input.sku}" ya está en uso`, {
          reason: 'DUPLICATE_SKU',
        });
      }
    }

    const currentMaxOrder = product.variants.reduce(
      (max, v) => Math.max(max, v.order),
      -1
    );

    return productRepository.createVariant({
      productId,
      name: input.name,
      sku: input.sku ?? null,
      price: input.price ?? null,
      stock: input.stock ?? 0,
      isAvailable: input.isAvailable ?? true,
      order: input.order ?? currentMaxOrder + 1,
    });
  },

  async updateVariant(variantId: string, input: UpdateVariantInput) {
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundError('Variante no encontrada');
    }

    if (input.name && input.name !== variant.name) {
      const existingName = await productRepository.findVariantByName(
        variant.productId,
        input.name
      );
      if (existingName && existingName.id !== variantId) {
        throw new ConflictError(
          `Ya existe una variante con el nombre "${input.name}" en este producto`,
          { reason: 'DUPLICATE_VARIANT_NAME' }
        );
      }
    }

    if (input.sku && input.sku !== variant.sku) {
      const skuTaken = await productRepository.skuExists(input.sku, variantId);
      if (skuTaken) {
        throw new ConflictError(`El SKU "${input.sku}" ya está en uso`, {
          reason: 'DUPLICATE_SKU',
        });
      }
    }

    return productRepository.updateVariant(variantId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    });
  },

  async deleteVariant(variantId: string): Promise<void> {
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundError('Variante no encontrada');
    }
    await productRepository.deleteVariant(variantId);
  },

  async reorderVariants(productId: string, variantIds: string[]): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const validIds = new Set(product.variants.map((v) => v.id));
    const allValid = variantIds.every((id) => validIds.has(id));

    if (!allValid || variantIds.length !== product.variants.length) {
      throw new BadRequestError(
        'La lista de IDs no coincide exactamente con las variantes del producto'
      );
    }

    await Promise.all(
      variantIds.map((id, index) => productRepository.updateVariantOrder(id, index))
    );
  },
};