"use client";

/**
 * app/admin/productos/page.tsx
 * Lista de productos del panel admin.
 *
 * - Fetch desde /admin/products (con token)
 * - Filtro por estado (ACTIVE / DRAFT / OUT_OF_STOCK)
 * - Cards en mobile, tabla en desktop
 * - Botón "+" flotante para agregar producto (mobile-friendly)
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  showPrice: boolean;
  status: ProductStatus;
  category: { id: string; name: string; slug: string };
  images: { url: string; thumbnailUrl: string | null; altText: string | null; order: number }[];
  createdAt: string;
}

interface ProductListResponse {
  items: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<ProductStatus, { label: string; style: string }> = {
  ACTIVE: { label: "Activo", style: "bg-green-100 text-green-800" },
  DRAFT: { label: "Borrador", style: "bg-yellow-100 text-yellow-800" },
  OUT_OF_STOCK: { label: "Sin stock", style: "bg-red-100 text-red-800" },
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) qs.set("status", statusFilter);
      const data = await adminFetch<ProductListResponse>(`/admin/products?${qs}`);
      setProducts(data.items);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 401) {
        router.push("/admin/login");
      } else {
        setError(e.message ?? "No se pudieron cargar los productos.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(product.id);
    try {
      await adminFetch(`/admin/products/${product.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header de página ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-xl font-semibold text-gray-900">Productos</h1>
          {!loading && (
            <p className="font-body text-xs text-gray-500 mt-0.5">
              {pagination.total} producto{pagination.total !== 1 ? "s" : ""} en total
            </p>
          )}
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-body text-sm rounded-md hover:bg-amber-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nuevo producto
        </Link>
      </div>

      {/* ── Filtro de estado ──────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "" as const, label: "Todos" },
          { value: "ACTIVE" as const, label: "Activos" },
          { value: "DRAFT" as const, label: "Borradores" },
          { value: "OUT_OF_STOCK" as const, label: "Sin stock" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3.5 py-1.5 rounded-full font-body text-xs whitespace-nowrap transition-colors ${
              statusFilter === opt.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Estado de carga / error ───────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" aria-label="Cargando productos" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Lista (mobile: cards, desktop: tabla) ─────────────────────────── */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-16">
          <p className="font-body text-gray-500 text-sm mb-4">
            No hay productos{statusFilter ? " con ese estado" : ""} todavía.
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-body text-sm rounded-md hover:bg-amber-700 transition-colors"
          >
            Crear el primer producto
          </Link>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {products.map((product) => {
              const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
              const status = STATUS_LABELS[product.status];
              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {thumb ? (
                      <Image
                        src={thumb.thumbnailUrl ?? thumb.url}
                        alt={thumb.altText ?? product.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300">
                          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M2 13l5-4 4 3 3-2.5 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="font-body text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`font-body text-[10px] px-2 py-0.5 rounded-full ${status.style}`}>
                        {status.label}
                      </span>
                      <span className="font-body text-xs text-gray-600">
                        {product.showPrice && product.price
                          ? formatPrice(product.price)
                          : "Sin precio"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="text-amber-700 hover:text-amber-800 transition-colors"
                      aria-label={`Editar ${product.name}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13 2.5l2.5 2.5-9 9L3 15l.5-3.5 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      {deletingId === product.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M3 5h12M7 5V3h4v2M6 8v6M12 8v6M5 5l.5 10h7L13 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left font-body text-xs tracking-wide text-gray-500 font-medium px-4 py-3">Producto</th>
                  <th className="text-left font-body text-xs tracking-wide text-gray-500 font-medium px-4 py-3">Categoría</th>
                  <th className="text-left font-body text-xs tracking-wide text-gray-500 font-medium px-4 py-3">Precio</th>
                  <th className="text-left font-body text-xs tracking-wide text-gray-500 font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-body text-xs tracking-wide text-gray-500 font-medium px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
                  const status = STATUS_LABELS[product.status];
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden bg-gray-100">
                            {thumb ? (
                              <Image
                                src={thumb.thumbnailUrl ?? thumb.url}
                                alt={thumb.altText ?? product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-300">
                                  <rect x="1" y="1" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="font-body text-sm text-gray-900 font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-gray-600">{product.category.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-gray-600">
                        {product.showPrice && product.price ? formatPrice(product.price) : (
                          <span className="text-gray-400 italic text-xs">Sin precio</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-body text-xs px-2 py-1 rounded-full ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="font-body text-xs text-amber-700 hover:text-amber-800 hover:underline transition-colors"
                          >
                            Editar
                          </Link>
                          <span className="text-gray-300">·</span>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="font-body text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            {deletingId === product.id ? "Eliminando…" : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="font-body text-xs text-gray-500">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── FAB mobile: botón "+" para nuevo producto ─────────────────────── */}
      <Link
        href="/admin/productos/nuevo"
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-700"
        aria-label="Nuevo producto"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 3v16M3 11h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
