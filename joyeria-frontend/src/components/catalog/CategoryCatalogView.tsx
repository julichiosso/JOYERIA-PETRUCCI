"use client";

/**
 * components/catalog/CategoryCatalogView.tsx
 * Vista interactiva de catálogo con barra de herramientas, ordenamiento y panel de filtros (estilo El Rubí).
 *
 * Opciones de orden:
 *  - Más nuevos primero
 *  - Más antiguos primero
 *  - Nombre: A – Z
 *  - Nombre: Z – A
 *  - Precio: menor a mayor (piezas con precio visible primero, luego consultar precio)
 *  - Precio: mayor a menor
 *
 * Filtros:
 *  - Rango de precio (Precio Mínimo / Precio Máximo)
 *  - Toggle para incluir/excluir piezas con precio a consultar
 */

import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

interface CategoryCatalogViewProps {
  initialProducts: Product[];
  categoryName: string;
}

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc";

export default function CategoryCatalogView({
  initialProducts,
  categoryName,
}: CategoryCatalogViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [includeConsultPrice, setIncludeConsultPrice] = useState(true);

  // Filtros aplicados
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [appliedIncludeConsult, setAppliedIncludeConsult] = useState(true);

  const hasActiveFilters =
    appliedMinPrice !== null || appliedMaxPrice !== null || !appliedIncludeConsult;

  const applyFilters = () => {
    setAppliedMinPrice(minPrice ? Number(minPrice) : null);
    setAppliedMaxPrice(maxPrice ? Number(maxPrice) : null);
    setAppliedIncludeConsult(includeConsultPrice);
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setIncludeConsultPrice(true);
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setAppliedIncludeConsult(true);
    setFilterDrawerOpen(false);
  };

  // Filtrar y ordenar los productos
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...initialProducts];

    // 1. Filtrar por precio
    list = list.filter((p) => {
      const priceNum = p.showPrice && p.price ? Number(p.price) : null;

      // Si no tiene precio visible
      if (priceNum === null) {
        return appliedIncludeConsult;
      }

      if (appliedMinPrice !== null && priceNum < appliedMinPrice) return false;
      if (appliedMaxPrice !== null && priceNum > appliedMaxPrice) return false;
      return true;
    });

    // 2. Ordenar
    list.sort((a, b) => {
      const priceA = a.showPrice && a.price ? Number(a.price) : null;
      const priceB = b.showPrice && b.price ? Number(b.price) : null;

      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, "es");
        case "name_desc":
          return b.name.localeCompare(a.name, "es");
        case "price_asc":
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceA - priceB;
        case "price_desc":
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA;
        case "oldest":
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        case "newest":
        default:
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
    });

    return list;
  }, [
    initialProducts,
    sortBy,
    appliedMinPrice,
    appliedMaxPrice,
    appliedIncludeConsult,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Barra de Herramientas: Contador, Botón Filtrar y Selector de Orden ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 font-body text-xs text-gray-500">
          <span>
            {filteredAndSortedProducts.length} pieza{filteredAndSortedProducts.length !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <span className="bg-amber-100 text-amber-900 text-[11px] font-medium px-2 py-0.5 rounded-full">
              Filtros activos
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Botón Filtrar */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-sm font-body text-xs tracking-wider uppercase text-gray-800 hover:border-black transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>Filtrar</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-600" />
            )}
          </button>

          {/* Selector de Orden */}
          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="sr-only sm:not-sr-only font-body text-xs text-gray-500">
              Ordenar:
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-sm font-body text-xs bg-white text-gray-900 focus:outline-none focus:border-black transition-colors cursor-pointer"
            >
              <option value="newest">Más nuevos</option>
              <option value="oldest">Más antiguos</option>
              <option value="name_asc">Nombre: A – Z</option>
              <option value="name_desc">Nombre: Z – A</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Grilla de Productos ────────────────────────────────────────────── */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-lg p-6 border border-gray-200">
          <p className="font-body text-sm text-gray-600 mb-2">
            No se encontraron piezas con los filtros aplicados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="font-body text-xs font-semibold text-amber-700 hover:underline uppercase tracking-wider"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
          {filteredAndSortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* ── Drawer de Filtros (Panel lateral) ──────────────────────────────── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm h-full flex flex-col p-6 shadow-2xl animate-slide-left overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
              <h2 className="font-display text-2xl text-gray-900 font-normal">
                Filtrar {categoryName}
              </h2>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-2xl p-1 leading-none"
                aria-label="Cerrar filtros"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              {/* Rango de Precios */}
              <div>
                <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-gray-900 mb-3">
                  Rango de Precio (ARS)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Mínimo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-sm font-body text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Máximo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Sin tope"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-sm font-body text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Piezas a Consultar */}
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConsultPrice}
                  onChange={(e) => setIncludeConsultPrice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-black border-gray-300 rounded"
                />
                <div>
                  <span className="font-body text-xs font-medium text-gray-900 block">
                    Incluir piezas &quot;Consultar precio&quot;
                  </span>
                  <span className="font-body text-[11px] text-gray-500 block mt-0.5 leading-snug">
                    Muestra también las piezas exclusivas cuyo valor se coordina por WhatsApp.
                  </span>
                </div>
              </label>
            </div>

            {/* Botones de acción del Drawer */}
            <div className="flex flex-col gap-2 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={applyFilters}
                className="w-full py-3 bg-black hover:bg-gray-800 text-white font-body text-xs tracking-widest uppercase rounded-sm transition-colors"
              >
                Aplicar filtros
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-body text-xs tracking-wider uppercase rounded-sm transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
