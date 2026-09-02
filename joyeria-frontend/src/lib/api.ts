/**
 * lib/api.ts
 * Cliente tipado para llamar al backend de Joyería Petrucci.
 */

import type { ProductListResponse, PublicProductResponse } from "@/types/product";
import type { Category } from "@/types/category";
import type { PublicStoreConfig } from "@/types/store-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = (body as { error?: string }).error ?? message;
    } catch {
      // mantiene el mensaje de status
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  catalog: {
    getProducts: (params?: { categoryId?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return apiFetch<ProductListResponse>(
        `/catalog/products${qs ? `?${qs}` : ""}`,
        { cache: "no-store" }
      );
    },

    getProductBySlug: (slug: string) =>
      apiFetch<PublicProductResponse>(`/catalog/products/${slug}`, {
        cache: "no-store",
      }),

    getCategories: async (): Promise<{ categories: Category[] }> => {
      const data = await apiFetch<Category[] | { categories: Category[] }>(
        "/catalog/categories",
        { cache: "no-store" }
      );
      return {
        categories: Array.isArray(data) ? data : data?.categories || [],
      };
    },

    getStoreConfig: () =>
      apiFetch<PublicStoreConfig>("/catalog/store-config", {
        cache: "no-store",
      }),
  },
};
