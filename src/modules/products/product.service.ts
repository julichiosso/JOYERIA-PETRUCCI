import { productRepository } from './product.repository.js';
import { slugify } from '../../shared/utils/slugify.js';
import type { CreateProductInput, UpdateProductInput } from './product.types.js';

class ProductNotFoundError extends Error {
  constructor() {
    super('Producto no encontrado');
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

export const productService = {
  async create(input: CreateProductInput) {
    const slug = await generateUniqueSlug(input.name);

    return productRepository.create({
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      status: input.status,
      variantLabel: input.variantLabel,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      category: { connect: { id: input.categoryId } },
    });
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    const slug = input.name ? await generateUniqueSlug(input.name, id) : undefined;

    return productRepository.update(id, {
      ...(input.name ? { name: input.name, slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.variantLabel !== undefined ? { variantLabel: input.variantLabel } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
    });
  },

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
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
      items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },
};

export { ProductNotFoundError };