// types/category.ts

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isProtected: boolean;
  sortOrder: number;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    isActive?: boolean;
    isProtected?: boolean;
  }[];
}

export interface CategoryListResponse {
  categories: Category[];
}
