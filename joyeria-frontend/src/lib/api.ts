/**
 * lib/api.ts
 * Cliente tipado para llamar al backend de Joyería Petrucci.
 */

import type { ProductListResponse, PublicProductResponse } from "@/types/product";
import type { CategoryListResponse } from "@/types/category";
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
        { next: { revalidate: 60 } } as RequestInit
      );
    },

    getProductBySlug: (slug: string) =>
      apiFetch<PublicProductResponse>(`/catalog/products/${slug}`, {
        next: { revalidate: 60 },
      } as RequestInit),

    getCategories: () =>
      apiFetch<CategoryListResponse>("/catalog/categories", {
        next: { revalidate: 300 },
      } as RequestInit),

    getStoreConfig: () =>
      apiFetch<PublicStoreConfig>("/catalog/store-config", {
        next: { revalidate: 3600 },
      } as RequestInit),

    // getWhatsAppLink: link general de la tienda (sin producto asociado).
    // TODO: descomentar cuando el backend implemente GET /catalog/whatsapp-link
    //
    // getWhatsAppLink: () =>
    //   apiFetch<{ url: string }>("/catalog/whatsapp-link", {
    //     next: { revalidate: 3600 },
    //   } as RequestInit),
  },
};
