"use client";

/**
 * app/admin/productos/page.tsx
 * Panel de Gestión y Monitoreo Integral de Productos — Petrucci Joyería.
 *
 * Características:
 *  - Monitoreo ordenado por secciones principales: JOYERÍA, RELOJES, MARROQUINERÍA, MATES, TRABAJOS PERSONALIZADOS.
 *  - Sub-filtros por categoría anidada (Aros, Anillos, Cadenas, Pulseras, etc.).
 *  - Búsqueda en tiempo real (por nombre, material o variante).
 *  - Filtros de estado (Todos, Activos, Borradores, Sin Stock).
 *  - Indicadores rápidos en el encabezado (Total piezas, Activos, Sin stock).
 *  - Vista dual optimizada: Tabla rica para Desktop / Tarjetas táctiles ergonómicas para Mobile.
 *  - Tipografía limpia y profesional idéntica a la tienda pública.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { adminFetch } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import type { Category } from "@/types/category";

type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  showPrice: boolean;
  status: ProductStatus;
  category: { id: string; name: string; slug: string; parent?: { id: string; name: string; slug: string } | null };
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

const SECTIONS = [
  { id: "ALL", name: "Todas las piezas" },
  { id: "JOYERIA", name: "Joyería", matchKeywords: ["joyer", "anillo", "aro", "cadena", "pulsera", "dije", "gargantilla", "alianza"] },
  { id: "RELOJES", name: "Relojes", matchKeywords: ["reloj", "tag heuer", "movado", "tissot", "victorinox", "festina", "seiko", "orient"] },
  { id: "MARROQUINERIA", name: "Marroquinería", matchKeywords: ["marroquiner", "billetera", "cinto", "cuero", "llavero"] },
  { id: "MATES", name: "Mates", matchKeywords: ["mate", "bombilla", "alpaca"] },
  { id: "PERSONALIZADOS", name: "Trabajos Personalizados", matchKeywords: ["personalizado", "grabado", "a pedido", "tallado"] },
];

const STATUS_CONFIG: Record<ProductStatus, { label: string; badgeClass: string }> = {
  ACTIVE: { label: "Activo", badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  DRAFT: { label: "Borrador", badgeClass: "bg-amber-50 text-amber-800 border border-amber-200" },
  OUT_OF_STOCK: { label: "Sin stock", badgeClass: "bg-rose-50 text-rose-800 border border-rose-200" },
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtros
  const [activeSection, setActiveSection] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Cargar categorías disponibles
  useEffect(() => {
    adminFetch<Category[] | { categories: Category[] }>("/admin/categories")
      .then((res) => {
        const cats = Array.isArray(res) ? res : res?.categories || [];
        setCategories(cats);
      })
      .catch(() => setCategories([]));
  }, []);

  // Cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<ProductListResponse>(`/admin/products?limit=100`);
      setProducts(data.items || []);
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
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Cambiar sección reinicia la subcategoría
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSelectedCategoryId("");
    setCurrentPage(1);
  };

  // Subcategorías relevantes según la sección seleccionada
  const sectionSubcategories = useMemo(() => {
    if (activeSection === "ALL") {
      return categories;
    }
    const currentSec = SECTIONS.find((s) => s.id === activeSection);
    if (!currentSec || !currentSec.matchKeywords) return [];

    return categories.filter((cat) => {
      const catName = cat.name.toLowerCase();
      const catSlug = cat.slug.toLowerCase();
      return currentSec.matchKeywords!.some((kw) => catName.includes(kw) || catSlug.includes(kw));
    });
  }, [categories, activeSection]);

  // Filtrado en memoria por Sección, Subcategoría, Estado y Búsqueda
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Filtro por sección principal
      if (activeSection !== "ALL") {
        const currentSec = SECTIONS.find((s) => s.id === activeSection);
        if (currentSec && currentSec.matchKeywords) {
          const catName = (prod.category?.name || "").toLowerCase();
          const catSlug = (prod.category?.slug || "").toLowerCase();
          const parentName = (prod.category?.parent?.name || "").toLowerCase();
          const prodName = prod.name.toLowerCase();

          const matches = currentSec.matchKeywords.some(
            (kw) =>
              catName.includes(kw) ||
              catSlug.includes(kw) ||
              parentName.includes(kw) ||
              prodName.includes(kw)
          );
          if (!matches) return false;
        }
      }

      // 2. Filtro por subcategoría específica
      if (selectedCategoryId) {
        if (prod.category?.id !== selectedCategoryId && prod.category?.parent?.id !== selectedCategoryId) {
          return false;
        }
      }

      // 3. Filtro por estado
      if (statusFilter && prod.status !== statusFilter) {
        return false;
      }

      // 4. Búsqueda por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCategory = (prod.category?.name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }

      return true;
    });
  }, [products, activeSection, selectedCategoryId, statusFilter, searchQuery]);

  // Paginación
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Contadores para KPIs
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "ACTIVE").length;
    const draft = products.filter((p) => p.status === "DRAFT").length;
    const outOfStock = products.filter((p) => p.status === "OUT_OF_STOCK").length;
    return { total, active, draft, outOfStock };
  }, [products]);

  // Eliminar producto
  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
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

  // Cambio rápido de estado
  const handleQuickStatusChange = async (product: AdminProduct, newStatus: ProductStatus) => {
    try {
      await adminFetch(`/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-body text-gray-900 pb-16">

      {/* ── Encabezado Principal & KPI Cards ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-gray-950 font-normal tracking-tight">
            Monitoreo de Joyas y Catálogo
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestioná todas las piezas organizadas por departamento, stock y disponibilidad en tienda.
          </p>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nueva Joya o Pieza</span>
        </Link>
      </div>

      {/* ── Métricas rápidas (KPIs) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">Total en Catálogo</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-2xs">
          <p className="text-xs text-emerald-700 font-medium">Activos en Tienda</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-3.5 shadow-2xs">
          <p className="text-xs text-amber-700 font-medium">Borradores Ocultos</p>
          <p className="text-xl font-bold text-amber-800 mt-1">{stats.draft}</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-xl p-3.5 shadow-2xs">
          <p className="text-xs text-rose-700 font-medium">Sin Stock</p>
          <p className="text-xl font-bold text-rose-800 mt-1">{stats.outOfStock}</p>
        </div>
      </div>

      {/* ── 1. Selector de Secciones Principales (Tabs) ───────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-2xs">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSectionChange(sec.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeSection === sec.id
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Barra de Búsqueda y Filtros de Estado ──────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre, material o modelo..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        {/* Filtro de Subcategoría (si aplica) */}
        {sectionSubcategories.length > 0 && (
          <div className="w-full md:w-56">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-amber-600"
            >
              <option value="">Todas las subcategorías</option>
              {sectionSubcategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtros de Estado */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {[
            { value: "" as const, label: "Todos" },
            { value: "ACTIVE" as const, label: "Activos" },
            { value: "DRAFT" as const, label: "Borradores" },
            { value: "OUT_OF_STOCK" as const, label: "Sin stock" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setStatusFilter(opt.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Estado de Carga / Error ───────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500 font-medium">Cargando catálogo...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* ── Lista Vacía ───────────────────────────────────────────────────── */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-6">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-gray-300 mb-3"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <p className="text-base font-medium text-gray-900">No se encontraron productos</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Probá cambiando los filtros o la búsqueda, o creá una nueva pieza para esta sección.
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Agregar producto
          </Link>
        </div>
      )}

      {/* ── Contenido de Productos (Mobile Cards + Desktop Table) ──────────── */}
      {!loading && !error && filteredProducts.length > 0 && (
        <>
          {/* 📱 Mobile: Tarjetas táctiles limpias */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginatedProducts.map((product) => {
              const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
              const status = STATUS_CONFIG[product.status];

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      {thumb ? (
                        <Image
                          src={thumb.thumbnailUrl ?? thumb.url}
                          alt={thumb.altText ?? product.name}
                          fill
                          className="object-contain p-1"
                          sizes="72px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          Sin foto
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-950 truncate leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {product.category?.name || "Sin categoría"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                          {status.label}
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          {product.showPrice && product.price ? formatPrice(product.price) : "A consultar"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones móviles directas */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                    {/* Selector rápido de estado */}
                    <select
                      value={product.status}
                      onChange={(e) => handleQuickStatusChange(product, e.target.value as ProductStatus)}
                      className="text-xs bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="DRAFT">Borrador</option>
                      <option value="OUT_OF_STOCK">Sin stock</option>
                    </select>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-1 rounded bg-amber-50"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === product.id ? "Borrando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 💻 Desktop: Tabla Premium */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Joya / Pieza</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => {
                  const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
                  const status = STATUS_CONFIG[product.status];

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/75 transition-colors group">
                      {/* Producto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                            {thumb ? (
                              <Image
                                src={thumb.thumbnailUrl ?? thumb.url}
                                alt={thumb.altText ?? product.name}
                                fill
                                className="object-contain p-1"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                                Sin foto
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-950 text-sm">{product.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">/{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                          {product.category?.name || "Sin asignar"}
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-3 text-sm">
                        {product.showPrice && product.price ? (
                          <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                        ) : (
                          <span className="text-xs text-amber-800 italic font-medium">A consultar</span>
                        )}
                      </td>

                      {/* Estado con selector rápido */}
                      <td className="px-4 py-3">
                        <select
                          value={product.status}
                          onChange={(e) => handleQuickStatusChange(product, e.target.value as ProductStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${status.badgeClass}`}
                        >
                          <option value="ACTIVE">Activo</option>
                          <option value="DRAFT">Borrador</option>
                          <option value="OUT_OF_STOCK">Sin stock</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="p-1.5 text-gray-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors"
                            title="Editar producto"
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                            title="Eliminar producto"
                          >
                            {deletingId === product.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Paginador ─────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-2xs">
              <p className="text-xs text-gray-500">
                Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems} piezas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-700 font-semibold px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Botón flotante Mobile (+) ─────────────────────────────────────── */}
      <Link
        href="/admin/productos/nuevo"
        className="md:hidden fixed bottom-6 right-5 z-40 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-800 transition-transform active:scale-95"
        aria-label="Agregar producto"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  );
}
