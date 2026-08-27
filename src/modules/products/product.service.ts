import { productRepository } from './product.repository.js';
import { slugify } from '../../shared/utils/slugify.js';
import type { CreateProductInput, UpdateProductInput, JsonLdEnvelope } from './product.types.js';

// ---------------------------------------------------------------------------
// SEO helpers
// ---------------------------------------------------------------------------

type ProductWithCategory = Awaited<ReturnType<typeof productRepository.findBySlug>>;

/**
 * Garantiza que `metaTitle` y `metaDescription` nunca sean null
 * en el catálogo público.
 *
 * Reglas de fallback:
 *  - metaTitle      → "{name} | Petrucci"  (truncado a 70 chars)
 *  - metaDescription → primeros 155 chars de `description`,
 *                      o "{name} en Petrucci Joyería — {categoria}"
 *
 * Solo se aplica en la ruta pública; los endpoints de admin devuelven
 * los valores crudos para que el equipo sepa qué campos están vacíos.
 */
function withSeoFallbacks<T extends NonNullable<ProductWithCategory>>(
  product: T
): Omit<T, 'metaTitle' | 'metaDescription'> & { metaTitle: string; metaDescription: string } {
  const categoryName = product.category?.name ?? '';
  const parentName   = product.category?.parent?.name ?? '';

  const fullCategory = parentName
    ? `${parentName} › ${categoryName}`
    : categoryName;

  const metaTitle = product.metaTitle?.trim() ||
    `${product.name} | Petrucci`.slice(0, 70);

  let metaDescription = product.metaDescription?.trim() || '';
  if (!metaDescription) {
    if (product.description) {
      // Limpia saltos de línea y recorta a 155 chars
      metaDescription = product.description
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 155);
      if (product.description.replace(/\s+/g, ' ').trim().length > 155) {
        metaDescription = metaDescription.trimEnd() + '…';
      }
    } else {
      metaDescription = fullCategory
        ? `${product.name} en Petrucci Joyería — ${fullCategory}.`
        : `${product.name} en Petrucci Joyería.`;
      metaDescription = metaDescription.slice(0, 160);
    }
  }

  return { ...product, metaTitle, metaDescription };
}

/**
 * Construye los objetos JSON-LD (schema.org) que el frontend inyecta
 * en `<script type="application/ld+json">`.
 *
 * Requiere `FRONTEND_URL` en el entorno (ej. https://petrucci.com).
 * Si no está configurada cae a cadena vacía y las URLs quedarán relativas
 * — mejor que crashear en producción.
 *
 * Mapeo ProductStatus → schema.org availability:
 *  ACTIVE        → InStock
 *  OUT_OF_STOCK  → OutOfStock
 *  DRAFT         → nunca llega aquí (controller devuelve 404 antes)
 */
function buildJsonLd(
  product: NonNullable<ProductWithCategory>,
  resolvedMeta: { metaTitle: string; metaDescription: string },
): JsonLdEnvelope {
  const baseUrl = (process.env['FRONTEND_URL'] ?? '').replace(/\/$/, '');

  const parentSlug   = product.category?.parent?.slug ?? null;
  const categorySlug = product.category?.slug ?? '';
  const productSlug  = product.slug;

  // URL canónica del producto: /parent/category/slug  o  /category/slug
  const productPath = parentSlug
    ? `/${parentSlug}/${categorySlug}/${productSlug}`
    : `/${categorySlug}/${productSlug}`;

  // Breadcrumb items
  const breadcrumbItems: JsonLdEnvelope['breadcrumb']['itemListElement'] = [];
  let position = 1;

  if (parentSlug && product.category?.parent) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: position++,
      name: product.category.parent.name,
      item: `${baseUrl}/${parentSlug}`,
    });
  }

  if (product.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: position++,
      name: product.category.name,
      item: parentSlug
        ? `${baseUrl}/${parentSlug}/${categorySlug}`
        : `${baseUrl}/${categorySlug}`,
    });
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: position++,
    name: product.name,
    item: `${baseUrl}${productPath}`,
  });

  // Offer (solo si hay precio)
  const offer: JsonLdEnvelope['product']['offers'] | undefined = product.price
    ? {
        '@type': 'Offer',
        price: product.price.toString(),
        priceCurrency: 'ARS',
        availability:
          product.status === 'OUT_OF_STOCK'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
      }
    : undefined;

  return {
    product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      ...(resolvedMeta.metaDescription ? { description: resolvedMeta.metaDescription } : {}),
      image: product.images.map((img) => img.url),
      ...(offer ? { offers: offer } : {}),
    },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  };
}

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
    // 1. Garantiza que metaTitle y metaDescription nunca sean null.
    const withMeta = withSeoFallbacks(product);
    // 2. Construye los objetos JSON-LD a partir del producto ya resuelto.
    const jsonLd = buildJsonLd(product, withMeta);
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