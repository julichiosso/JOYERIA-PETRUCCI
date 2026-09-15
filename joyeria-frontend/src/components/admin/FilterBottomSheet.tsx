"use client";

import { useEffect } from "react";

/**
 * FilterBottomSheet.tsx
 * Bottom Sheet ergonómico para mobile admin Petrucci.
 * Reemplaza filtros estáticos por un panel flotante que despeja el 40% del espacio visual de pantalla.
 */

export interface FilterState {
    categoryId: string;
    status: string; // 'ALL' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK'
    sortBy: string; // 'recent' | 'price_asc' | 'price_desc'
}

interface CategoryOption {
    id: string;
    name: string;
}

interface FilterBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    categories: CategoryOption[];
    filters: FilterState;
    onApplyFilters: (newFilters: FilterState) => void;
    totalResultsCount?: number;
}

export default function FilterBottomSheet({
    isOpen,
    onClose,
    categories,
    filters,
    onApplyFilters,
    totalResultsCount,
}: FilterBottomSheetProps) {
    // Manejo de scroll lock en body cuando la hoja está abierta
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop con blur */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Contenedor del Bottom Sheet */}
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up font-sans">

                {/* Handle bar de arrastre ergonómico */}
                <div className="pt-3 pb-2 flex flex-col items-center justify-center shrink-0 border-b border-[#E5E5EA]">
                    <div className="w-10 h-1.2 rounded-full bg-gray-300 mb-2" />
                    <div className="w-full px-5 flex items-center justify-between">
                        <h3 className="text-base font-bold text-[#1D1D1F] tracking-tight">
                            Filtrar y Ordenar Catálogo
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
                            aria-label="Cerrar filtros"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Cuerpos de filtros con scroll independiente */}
                <div className="p-5 overflow-y-auto flex flex-col gap-6">

                    {/* 1. ESTADO DEL PRODUCTO (EN VIDRIERA / OCULTO / SIN STOCK) */}
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                            Estado en Tienda
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: "ALL", label: "Todas las piezas" },
                                { id: "ACTIVE", label: "✨ En Vidriera" },
                                { id: "DRAFT", label: "🔒 Oculto / Borrador" },
                                { id: "OUT_OF_STOCK", label: "⚠️ Sin Stock" },
                            ].map((opt) => {
                                const isSelected = filters.status === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => onApplyFilters({ ...filters, status: opt.id })}
                                        className={`py-3 px-3.5 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer active:scale-95 min-h-[44px] flex items-center justify-between border ${isSelected
                                                ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]"
                                                : "bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:bg-gray-200/70"
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <span className="font-bold text-sm">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. CATEGORÍAS (PILLS EN SCROLL HORIZONTAL / GRID) */}
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                            Categoría de Joya
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onApplyFilters({ ...filters, categoryId: "ALL" })}
                                className={`py-2.5 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 min-h-[40px] border ${filters.categoryId === "ALL"
                                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                                        : "bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:bg-gray-200/70"
                                    }`}
                            >
                                Todas las categorías
                            </button>
                            {categories.map((cat) => {
                                const isSelected = filters.categoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => onApplyFilters({ ...filters, categoryId: cat.id })}
                                        className={`py-2.5 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 min-h-[40px] border ${isSelected
                                                ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                                                : "bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:bg-gray-200/70"
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. ORDENAMIENTO */}
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                            Ordenar Por
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "recent", label: "Más recientes" },
                                { id: "price_asc", label: "Menor precio" },
                                { id: "price_desc", label: "Mayor precio" },
                            ].map((opt) => {
                                const isSelected = filters.sortBy === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => onApplyFilters({ ...filters, sortBy: opt.id })}
                                        className={`py-2.5 px-2 rounded-2xl text-[11px] font-semibold text-center transition-all cursor-pointer active:scale-95 min-h-[44px] flex items-center justify-center border ${isSelected
                                                ? "bg-[#007AFF] text-white border-[#007AFF]"
                                                : "bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:bg-gray-200/70"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer fijo en zona de pulgar */}
                <div className="p-4 border-t border-[#E5E5EA] bg-white flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                            onApplyFilters({
                                categoryId: "ALL",
                                status: "ALL",
                                sortBy: "recent",
                            })
                        }
                        className="px-4 py-3 bg-[#F5F5F7] hover:bg-gray-200 active:scale-95 text-[#1D1D1F] text-xs font-bold rounded-2xl transition-all cursor-pointer min-h-[48px]"
                    >
                        Limpiar
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer min-h-[48px] flex items-center justify-center gap-1"
                    >
                        <span>Ver resultados</span>
                        {totalResultsCount !== undefined && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
                                {totalResultsCount}
                            </span>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
