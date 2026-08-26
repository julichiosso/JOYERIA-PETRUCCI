import type { ProductStatus } from '@prisma/client';

export interface CreateProductInput {
  name: string;
  description?: string;
  price?: number;
  status: ProductStatus;
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
  price: string | null; // Decimal serializado como string, null si no tiene precio fijo
  status: ProductStatus;
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