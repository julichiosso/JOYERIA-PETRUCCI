// types/product.ts
// Espejo exacto de lo que devuelve el backend en /catalog/products y /catalog/products/:slug
//
// NOTA IMPORTANTE:
//  - ProductVariant NO existe en el backend. El modelo tiene `variantLabel: string | null`
//    como campo de texto libre en Product. No hay tabla de variantes.
//  - El campo `sku` tampoco existe a nivel de Product todavía. Se agrega cuando el backend lo tenga.

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  order: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** null cuando showPrice: false — el precio NUNCA viaja al frontend en ese caso */
  price: string | null;
  showPrice: boolean;
  status: ProductStatus;
  /** Texto libre de variantes (ej: "Disponible en oro blanco, amarillo y rosé").
   *  No hay un modelo ProductVariant — esto es solo un label informativo. */
  variantLabel: string | null;
  metaTitle: string;
  metaDescription: string;
  category: ProductCategory;
  images: ProductImage[];
}

export interface PublicProductResponse extends Product {
  /** Link de WhatsApp ya construido por el backend — usar directamente en el CTA,
   *  no reconstruir en el frontend */
  whatsappLink: string;
  jsonLd: {
    product: Record<string, unknown>;
    breadcrumb: Record<string, unknown>;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: Pagination;
}
