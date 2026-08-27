import type { ProductStatus } from '@prisma/client';

export interface CreateProductInput {
  name: string;
  description?: string;
  price?: number;
  status: ProductStatus;
  showPrice: boolean;
  variantLabel?: string;
  categoryId: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  status?: ProductStatus;
  showPrice?: boolean;
  variantLabel?: string;
  categoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | null;
  status: ProductStatus;
  showPrice: boolean;
  variantLabel: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  images: {
    id: string;
    url: string;
    order: number;
  }[];
}

// ---------------------------------------------------------------------------
// JSON-LD / schema.org types
// ---------------------------------------------------------------------------

/** schema.org/Offer embebido en un Product */
export interface JsonLdOffer {
  '@type': 'Offer';
  price: string;
  priceCurrency: 'ARS';
  availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
}

/** schema.org/Product para Google Rich Results */
export interface JsonLdProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  image: string[];
  offers?: JsonLdOffer;
}

/** Un ítem de la lista de migas de pan */
export interface JsonLdBreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

/** schema.org/BreadcrumbList */
export interface JsonLdBreadcrumb {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: JsonLdBreadcrumbItem[];
}

/** Envelope con los dos objetos JSON-LD que necesita el frontend */
export interface JsonLdEnvelope {
  product: JsonLdProduct;
  breadcrumb: JsonLdBreadcrumb;
}

/**
 * Shape completa del response del catálogo público:
 * producto + metadatos SEO siempre resueltos + JSON-LD listo para el frontend.
 *
 * NOTA CANONICAL: hoy `categoryId` es 1:1, por lo que la URL canónica es
 * siempre única. Si en el futuro se agrega multi-categoría, agregar un campo
 * `canonicalCategoryId: string` en el modelo Product y usarlo aquí para
 * determinar la URL del breadcrumb y del `<link rel="canonical">`.
 */
export interface PublicProductResponse extends ProductWithCategory {
  /** metaTitle nunca null (fallback aplicado en productService.getBySlug) */
  metaTitle: string;
  /** metaDescription nunca null (fallback aplicado en productService.getBySlug) */
  metaDescription: string;
  /** Datos estructurados schema.org listos para inyectar en <script type="application/ld+json"> */
  jsonLd: JsonLdEnvelope;
}
