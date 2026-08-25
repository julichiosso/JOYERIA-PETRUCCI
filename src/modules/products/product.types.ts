export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  available: boolean;
  variantLabel?: string;
  categoryId: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  available?: boolean;
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
  price: string; // Decimal serializado como string
  available: boolean;
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