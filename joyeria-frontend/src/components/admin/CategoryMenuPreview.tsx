"use client";

/**
 * components/admin/CategoryMenuPreview.tsx
 * Muestra una vista previa en vivo del menú de navegación de la tienda.
 * Diseñado con overflow-visible y z-index adecuado para que los submenús
 * no choquen ni se recorten con los divs inferiores.
 */

import { useState } from "react";
import type { Category } from "@/types/category";

export default function CategoryMenuPreview({ categories }: { categories: Category[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const visibleRoots = categories.filter((c) => c.isActive);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs transition-all">
      {/* Header colapsable para ahorrar espacio de scroll */}
      <div className="px-4 py-2.5 bg-gray-900 text-white rounded-t-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Vista previa del menú en la tienda
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-300 hover:text-white px-2 py-0.5 rounded hover:bg-gray-800 transition-colors font-medium flex items-center gap-1"
        >
          <span>{isExpanded ? "Ocultar vista previa" : "Ver vista previa"}</span>
          <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="relative">
          {/* Barra de menú con overflow visible */}
          <div className="relative bg-white px-4 py-1 border-b border-gray-100 z-20">
            <nav className="flex items-center justify-center gap-4 md:gap-6 min-h-[44px] flex-wrap">
              {visibleRoots.length === 0 ? (
                <span className="text-xs text-gray-400 italic py-2">
                  No tenés secciones visibles todavía.
                </span>
              ) : (
                visibleRoots.map((cat) => {
                  const hasChildren = cat.children && cat.children.filter((s) => s.isActive !== false).length > 0;
                  const isOpen = openId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="relative"
                      onMouseEnter={() => setOpenId(cat.id)}
                      onMouseLeave={() => setOpenId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : cat.id)}
                        className={`text-xs md:text-sm py-2 px-2 border-b-2 font-medium transition-colors flex items-center gap-1 ${
                          isOpen
                            ? "border-black text-black font-semibold"
                            : "border-transparent text-gray-700 hover:text-black"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {hasChildren && (
                          <span className="text-[10px] text-gray-400 transition-transform">
                            {isOpen ? "▴" : "▾"}
                          </span>
                        )}
                      </button>

                      {/* Dropdown flotante con z-30 y sombra sin ser recortado */}
                      {isOpen && hasChildren && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg py-1.5 min-w-[170px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                          {cat.children
                            ?.filter((sub) => sub.isActive !== false)
                            .map((sub) => (
                              <div
                                key={sub.id}
                                className="px-4 py-2 text-xs text-gray-700 hover:text-black hover:bg-gray-50 cursor-default transition-colors"
                              >
                                {sub.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
          </div>

          <div className="px-4 py-1.5 bg-gray-50 rounded-b-xl flex items-center justify-between text-[11px] text-gray-500">
            <span>Pasá el cursor (o tocá) para desplegar los sub-rubros</span>
            <span className="text-gray-400">Total visibles: {visibleRoots.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}