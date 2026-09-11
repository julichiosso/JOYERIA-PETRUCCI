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
import { useToast } from "@/hooks/useToast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; dotClass: string; containerClass: string; textClass: string }
> = {
  ACTIVE: {
    label: "Publicado",
    dotClass: "bg-green-500",
    containerClass: "bg-green-50 border border-green-200",
    textClass: "text-green-700",
  },
  DRAFT: {
    label: "Borrador",
    dotClass: "bg-gray-400",
    containerClass: "bg-gray-100 border border-gray-200",
    textClass: "text-gray-500",
  },
  OUT_OF_STOCK: {
    label: "Sin stock",
    dotClass: "bg-amber-500",
    containerClass: "bg-amber-50 border border-amber-200",
    textClass: "text-amber-700",
  },
};

/**
 * StatusChanger
 * Badge interactivo que abre un popup para cambiar el estado del producto.
 * Reemplaza al <select> nativo para mantener coherencia con el design system.
 */
function StatusChanger({
  product,
  onStatusChange,
  popupId,
  setPopupId,
}: {
  product: AdminProduct;
  onStatusChange: (product: AdminProduct, status: ProductStatus) => void;
  popupId: string | null;
  setPopupId: (id: string | null) => void;
}) {
  const config = STATUS_CONFIG[product.status];
  const isOpen = popupId === product.id;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setPopupId(isOpen ? null : product.id)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors min-h-[36px] font-sans ${config.containerClass} ${config.textClass}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Estado actual: ${config.label}. Tocá para cambiar.`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} aria-hidden="true" />
        {config.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className={`ml-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop para cerrar al tocar fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setPopupId(null)} />
          <div
            role="listbox"
            aria-label="Cambiar estado"
            className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-gray-200/80 shadow-xl rounded-2xl py-1.5 z-50 font-sans"
          >
            {(["ACTIVE", "DRAFT", "OUT_OF_STOCK"] as ProductStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              const isSelected = product.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onStatusChange(product, s);
                    setPopupId(null);
                  }}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#007AFF]/10 text-[#007AFF]"
                      : "text-gray-700 hover:bg-[#F5F5F7]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dotClass}`} aria-hidden="true" />
                  {c.label}
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      className="ml-auto text-[#007AFF]"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Estado del popup de cambio rápido de estado (id del producto con popup abierto)
  const [statusPopupId, setStatusPopupId] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<AdminProduct | null>(null);

  // Filtros
  const [activeSection, setActiveSection] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
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

  // Iniciar modal de confirmación de eliminación
  const handleDeleteClick = (product: AdminProduct) => {
    setDeleteModalProduct(product);
  };

  // Confirmar eliminación desde el modal
  const confirmDeleteProduct = async () => {
    if (!deleteModalProduct) return;
    const prod = deleteModalProduct;
    setDeletingId(prod.id);
    try {
      await adminFetch(`/admin/products/${prod.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      toast.success(`"${prod.name}" fue eliminado del catálogo`);
      setDeleteModalProduct(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  // Cambio rápido de estado con toast + deshacer
  const handleQuickStatusChange = async (product: AdminProduct, newStatus: ProductStatus) => {
    const previousStatus = product.status;
    if (previousStatus === newStatus) return;

    // Actualización optimista
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
    );

    try {
      await adminFetch(`/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (newStatus === "ACTIVE") {
        toast.success(`"${product.name}" ahora está activo en la tienda`);
      } else {
        const label = newStatus === "DRAFT" ? "Borrador (oculto)" : "Sin stock";
        toast.undo(
          `"${product.name}" cambiado a ${label}`,
          async () => {
            // Callback de Deshacer
            try {
              await adminFetch(`/admin/products/${product.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: previousStatus }),
              });
              setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? { ...p, status: previousStatus } : p))
              );
              toast.info(`Se restauró el estado de "${product.name}"`);
            } catch (err: unknown) {
              const e = err as { message?: string };
              toast.error(e.message ?? "No se pudo deshacer el cambio.");
            }
          }
        );
      }
    } catch (err: unknown) {
      // Revertir en caso de error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: previousStatus } : p))
      );
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto font-sans text-gray-900 pb-16">

      {/* ── Encabezado Principal ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl text-[#1D1D1F] font-bold tracking-tight font-sans">
            Joyas en Tienda
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-normal font-sans">
            Tocá el botón para cargar una joya nueva.
          </p>
        </div>

        {/* En mobile solo existe el botón fijo del bottom — un único CTA primario por pantalla */}
        <Link
          href="/admin/productos/nuevo"
          className="hidden md:inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1D1D1F] hover:bg-black !text-white text-sm font-semibold uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
        >
          <span className="!text-white font-bold text-lg leading-none">+</span>
          <span className="!text-white">CARGAR JOYA</span>
        </Link>
      </div>

      {/* ── Resumen Ejecutivo (Tira de métricas sobria Apple) ────────────────────── */}
     {/*  <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/80">
          <div className="pt-2 md:pt-0 md:px-4 first:pl-0">
            <p className="font-sans text-xs uppercase tracking-wider text-gray-400 font-semibold">Total en Catálogo</p>
            <p className="font-sans text-3xl font-bold text-[#1D1D1F] mt-1">{stats.total}</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-4">
            <p className="font-sans text-xs uppercase tracking-wider text-gray-400 font-semibold">Publicados en Tienda</p>
            <p className="font-sans text-3xl font-bold text-[#007AFF] mt-1">{stats.active}</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-4">
            <p className="font-sans text-xs uppercase tracking-wider text-gray-400 font-semibold">Borradores Ocultos</p>
            <p className="font-sans text-3xl font-bold text-gray-700 mt-1">{stats.draft}</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-4">
            <p className="font-sans text-xs uppercase tracking-wider text-gray-400 font-semibold">Sin Stock</p>
            <p className="font-sans text-3xl font-bold text-gray-400 mt-1">{stats.outOfStock}</p>
          </div>
        </div>
      </div> */}

      {/* ── 1. Selector de Secciones Principales (Tabs Sobrios Apple) ────────────── */}
      <div className="border-b border-gray-200/80">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSectionChange(sec.id)}
              className={`px-4 py-3 text-xs uppercase tracking-wider transition-all cursor-pointer font-sans whitespace-nowrap border-b-2 ${activeSection === sec.id
                ? "border-[#007AFF] text-[#007AFF] font-bold"
                : "border-transparent text-gray-500 hover:text-[#1D1D1F] hover:border-gray-300 font-semibold"
                }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Barra de Búsqueda y Filtros de Estado ──────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Buscador de texto (Estilo Apple: sin outline/ring azul nativo) */}
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
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
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] border border-gray-200/80 rounded-2xl text-xs font-semibold text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-0 focus:border-gray-400 transition-all font-sans"
          />
        </div>

        {/* Filtro de Subcategoría (Pop-up Estilo Apple en lugar de select nativo) */}
        {sectionSubcategories.length > 0 && (
          <div className="relative w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
              className="w-full md:w-auto min-w-[180px] px-4 py-2.5 bg-[#F5F5F7] hover:bg-gray-200/70 border border-gray-200/80 rounded-2xl text-xs font-semibold text-[#1D1D1F] flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <span>
                {selectedCategoryId
                  ? sectionSubcategories.find((c) => c.id === selectedCategoryId)?.name || "Subcategoría"
                  : "Todas las subcategorías"}
              </span>
              <span className="text-[10px] text-gray-400">▾</span>
            </button>

            {isSubcategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSubcategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-full md:w-56 bg-white border border-gray-200/80 shadow-xl rounded-2xl py-1.5 z-50 animate-in fade-in duration-100 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId("");
                      setCurrentPage(1);
                      setIsSubcategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${selectedCategoryId === ""
                      ? "bg-[#007AFF]/10 text-[#007AFF]"
                      : "text-gray-700 hover:bg-[#F5F5F7]"
                      }`}
                  >
                    Todas las subcategorías
                  </button>
                  {sectionSubcategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(c.id);
                        setCurrentPage(1);
                        setIsSubcategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${selectedCategoryId === c.id
                        ? "bg-[#007AFF]/10 text-[#007AFF]"
                        : "text-gray-700 hover:bg-[#F5F5F7]"
                        }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === opt.value
                ? "bg-[#007AFF] text-white"
                : "bg-[#F5F5F7] text-gray-600 hover:bg-gray-200/70"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Estado de Carga / Error ───────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200/80 rounded-3xl">
          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-sans text-sm text-gray-500 font-medium">Cargando catálogo...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
          {error}
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
          {/* 📱 Mobile: Tarjetas táctiles limpias de lujo */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginatedProducts.map((product) => {
              const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
              const status = STATUS_CONFIG[product.status];

              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#E8E4DE] rounded-lg p-4 flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-[#FAF8F5] border border-[#E8E4DE]">
                      {thumb ? (
                        <Image
                          src={thumb.thumbnailUrl ?? thumb.url}
                          alt={thumb.altText ?? product.name}
                          fill
                          className="object-contain p-1"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300" aria-hidden="true">
                            <path d="M12 2L2 9l10 13L22 9 12 2z" />
                            <path d="M2 9h20" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[#1D1D1F] font-bold text-base truncate leading-tight tracking-tight">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate font-sans">
                        {product.category?.name || "Sin categoría"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.containerClass} ${status.textClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dotClass}`} aria-hidden="true" />
                          {status.label}
                        </span>
                        <span className="font-sans text-sm font-bold text-[#1D1D1F]">
                          {product.showPrice && product.price ? formatPrice(product.price) : "A consultar"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones móviles */}
                  <div className="flex items-center justify-between border-t border-gray-200/80 pt-3 mt-1 gap-3">
                    <StatusChanger
                      product={product}
                      onStatusChange={handleQuickStatusChange}
                      popupId={statusPopupId}
                      setPopupId={setStatusPopupId}
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 min-h-[36px] flex items-center transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(product)}
                        disabled={deletingId === product.id}
                        className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200/60 bg-red-50/40 disabled:opacity-40 min-h-[36px] flex items-center cursor-pointer transition-colors"
                      >
                        {deletingId === product.id ? "Borrando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 💻 Desktop: Tabla Estilo Apple iOS */}
          <div className="hidden md:block bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-gray-200/80 bg-[#F5F5F7]">
                  <th className="px-5 py-4 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">Joya / Pieza</th>
                  <th className="px-5 py-4 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-5 py-4 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-5 py-4 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-4 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 font-sans">
                {paginatedProducts.map((product) => {
                  const thumb = product.images.find((i) => i.order === 0) ?? product.images[0];
                  const status = STATUS_CONFIG[product.status];

                  return (
                    <tr key={product.id} className="hover:bg-[#F5F5F7]/60 transition-colors group">
                      {/* Producto */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-[#F5F5F7] border border-gray-200/80">
                            {thumb ? (
                              <Image
                                src={thumb.thumbnailUrl ?? thumb.url}
                                alt={thumb.altText ?? product.name}
                                fill
                                className="object-contain p-1"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300" aria-hidden="true">
                                  <path d="M12 2L2 9l10 13L22 9 12 2z" />
                                  <path d="M2 9h20" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-sans text-sm font-bold text-[#1D1D1F] tracking-tight">{product.name}</p>
                            <p className="text-[11px] text-gray-400 font-sans mt-0.5">/{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-5 py-3.5 text-gray-700 font-sans text-xs">
                        <span className="bg-[#F5F5F7] border border-gray-200/80 px-3 py-1 rounded-full text-gray-600 font-semibold">
                          {product.category?.name || "Sin asignar"}
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="px-5 py-3.5">
                        {product.showPrice && product.price ? (
                          <span className="font-sans text-sm font-bold text-[#1D1D1F]">{formatPrice(product.price)}</span>
                        ) : (
                          <span className="font-sans text-xs text-gray-400 font-medium">A consultar</span>
                        )}
                      </td>

                      {/* Estado con StatusChanger — popup consistente con el design system */}
                      <td className="px-5 py-3.5">
                        <StatusChanger
                          product={product}
                          onStatusChange={handleQuickStatusChange}
                          popupId={statusPopupId}
                          setPopupId={setStatusPopupId}
                        />
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="p-2 text-gray-500 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-colors"
                            title="Editar producto"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product)}
                            disabled={deletingId === product.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                            title="Eliminar producto"
                          >
                            {deletingId === product.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-3xl px-5 py-3 shadow-xs font-sans">
              <p className="text-xs text-gray-500">
                Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems} piezas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3.5 py-1.5 border border-gray-200/80 rounded-full text-xs font-semibold text-gray-700 hover:bg-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <span className="text-xs text-[#1D1D1F] font-bold px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3.5 py-1.5 border border-gray-200/80 rounded-full text-xs font-semibold text-gray-700 hover:bg-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}


      {/* ── Botón Fijo Mobile: "+ CARGAR NUEVA JOYA" (Súper fácil de ver y tocar) ────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-300 z-40 shadow-lg">
        <Link
          href="/admin/productos/nuevo"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#1D1D1F] active:bg-black !text-white rounded-2xl font-semibold text-sm uppercase tracking-wide shadow-xs active:scale-[0.98] transition-all min-h-[48px]"
        >
          <span className="!text-white">CARGAR JOYA</span>
        </Link>
      </div>

      {/* ── Modal de Confirmación de Eliminación ──────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteModalProduct}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar "${deleteModalProduct?.name}"? Esta acción borrará la pieza del catálogo y no se podrá deshacer.`}
        confirmLabel="Eliminar pieza"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deletingId === deleteModalProduct?.id}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteModalProduct(null)}
      />
    </div>
  );
}
