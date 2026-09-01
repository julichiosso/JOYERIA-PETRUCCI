// src/modules/products/product.seo.ts
import type { JsonLdEnvelope } from './product.types.js';
import type { productRepository } from './product.repository.js';

export type ProductEntityWithRelations = NonNullable<Awaited<ReturnType<typeof productRepository.findBySlug>>>;

/**
 * Garantiza que `metaTitle` y `metaDescription` nunca sean null en el catálogo público.
 *
 * Reglas de fallback:
 *  - metaTitle       -> "{name} | Petrucci" (truncado a 70 chars)
 *  - metaDescription -> primeros 155 chars de `description` o "{name} en Petrucci Joyería - {categoria}"
 */
export function withSeoFallbacks<T extends ProductEntityWithRelations>(
  product: T
): Omit<T, 'metaTitle' | 'metaDescription'> & { metaTitle: string; metaDescription: string } {
  const categoryName = product.category?.name ?? '';
  const parentName = product.category?.parent?.name ?? '';

  const fullCategory = parentName
    ? `${parentName} › ${categoryName}`
    : categoryName;

  const metaTitle =
    product.metaTitle?.trim() || `${product.name} | Petrucci`.slice(0, 70);

  let metaDescription = product.metaDescription?.trim() || '';
  if (!metaDescription) {
    if (product.description) {
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
 * Construye los objetos JSON-LD (schema.org) que el frontend inyecta en <script type="application/ld+json">.
 *
 * Mapeo ProductStatus -> schema.org availability:
 *  ACTIVE       -> InStock
 *  OUT_OF_STOCK -> OutOfStock
 */
export function buildJsonLd(
  product: ProductEntityWithRelations,
  resolvedMeta: { metaTitle: string; metaDescription: string }
): JsonLdEnvelope {
  const baseUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');

  const parentSlug = product.category?.parent?.slug ?? null;
  const categorySlug = product.category?.slug ?? '';
  const productSlug = product.slug;

  const productPath = parentSlug
    ? `/${parentSlug}/${categorySlug}/${productSlug}`
    : `/${categorySlug}/${productSlug}`;

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

  const offer: JsonLdEnvelope['product']['offers'] = {
    '@type': 'Offer',
    priceCurrency: 'ARS',
    availability:
      product.status === 'OUT_OF_STOCK'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    ...(product.price ? { price: product.price.toString() } : {}),
  };

  return {
    product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      ...(resolvedMeta.metaDescription ? { description: resolvedMeta.metaDescription } : {}),
      image: product.images.map((img) => img.url),
      offers: offer,
    },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  };
}
