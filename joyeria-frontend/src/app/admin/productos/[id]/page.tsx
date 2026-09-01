"use client";

/**
 * app/admin/productos/[id]/page.tsx
 * Página para editar un producto existente.
 *
 * Carga el producto por ID desde /admin/products/:id y pre-rellena el formulario.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";
import type { UploadedImage } from "@/components/admin/ImageUploader";

interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | null;
  showPrice: boolean;
  status: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";
  variantLabel: string | null;
  categoryId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  images: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    order: number;
  }[];
}

export default function EditarProductoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminProductDetail>(`/admin/products/${params.id}`)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err: { status?: number; message?: string }) => {
        if (err.status === 401) {
          router.push("/admin/login");
        } else if (err.status === 404) {
          setError("Producto no encontrado.");
        } else {
          setError(err.message ?? "No se pudo cargar el producto.");
        }
        setLoading(false);
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" aria-label="Cargando producto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-gray-600 mb-4">{error ?? "Producto no encontrado."}</p>
        <button
          onClick={() => router.back()}
          className="font-body text-sm text-amber-700 hover:underline"
        >
          ← Volver a la lista
        </button>
      </div>
    );
  }

  // Mapear las imágenes del backend al formato que entiende ImageUploader
  const initialImages: UploadedImage[] = product.images
    .sort((a, b) => a.order - b.order)
    .map((img) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      altText: img.altText,
      order: img.order,
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="font-body text-xl font-semibold text-gray-900 truncate">
          Editar: {product.name}
        </h1>
        <p className="font-body text-xs text-gray-500 mt-1">
          Los cambios se reflejan en la tienda en cuanto guardás.
        </p>
      </div>

      {/* Formulario pre-rellenado */}
      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          categoryId: product.categoryId,
          status: product.status,
          price: product.price ?? "",
          showPrice: product.showPrice,
          variantLabel: product.variantLabel ?? "",
          metaTitle: product.metaTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          images: initialImages,
        }}
      />
    </div>
  );
}
