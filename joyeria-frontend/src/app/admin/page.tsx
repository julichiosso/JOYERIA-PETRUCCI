"use client";

/**
 * app/admin/page.tsx
 * Dashboard de Respuesta Rápida — Admin Mobile Petrucci.
 *
 * Principio UX: Reducir tiempo-a-acción.
 * Responde "¿Qué necesito hacer YA?" antes que "¿Qué hay acá?".
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";

interface DashboardStats {
  inquiriesCount: number;
  outOfStockCount: number;
  totalProductsCount: number;
  activeProductsCount: number;
  draftProductsCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    inquiriesCount: 0,
    outOfStockCount: 0,
    totalProductsCount: 0,
    activeProductsCount: 0,
    draftProductsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, inquiriesRes] = await Promise.all([
        adminFetch<{ items: Array<{ id: string; status: string }> }>("/admin/products?limit=100").catch(() => ({ items: [] })),
        adminFetch<{ pagination?: { total?: number } }>("/admin/inquiries?limit=1").catch(() => ({ pagination: { total: 0 } })),
      ]);

      const items = productsRes.items || [];
      const outOfStock = items.filter((p) => p.status === "OUT_OF_STOCK").length;
      const active = items.filter((p) => p.status === "ACTIVE").length;
      const draft = items.filter((p) => p.status === "DRAFT").length;
      const inquiries = inquiriesRes.pagination?.total || 0;

      setStats({
        inquiriesCount: inquiries,
        outOfStockCount: outOfStock,
        totalProductsCount: items.length,
        activeProductsCount: active,
        draftProductsCount: draft,
      });
    } catch {
      // Manejo silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const allClear = stats.outOfStockCount === 0;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto font-sans text-[#1D1D1F] pb-24 px-1 sm:px-0">

      {/* ── Encabezado de Bienvenida ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 pb-2 border-b border-[#E5E5EA]">
        <div>
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
            Panel del Comerciante
          </span>
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Petrucci Admin
          </h1>
        </div>
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="p-2.5 rounded-full bg-white border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Actualizar datos"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>

      {/* ── 1. BOTÓN PRINCIPAL DE ALTO IMPACTO (+ Agregar Producto) ──────── */}
      <Link
        href="/admin/productos/nuevo"
        className="group relative flex items-center justify-between p-5 bg-[#1D1D1F] hover:bg-black active:scale-[0.98] text-white rounded-3xl shadow-md transition-all cursor-pointer min-h-[64px]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            +
          </div>
          <div>
            <span className="text-base font-bold tracking-tight block text-white">
              Cargar Nueva Joya
            </span>
            <span className="text-xs text-gray-400 font-normal block">
              Agregar foto, precio y categoría en 1 tap
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
          →
        </div>
      </Link>

      {/* ── 2. SECCIÓN: "¿QUÉ NECESITO HACER YA?" (Tarjetas de Atención Inmediata) ─ */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider px-1">
          Atención Inmediata
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-white/70 border border-[#E5E5EA] rounded-3xl animate-pulse" />
            <div className="h-28 bg-white/70 border border-[#E5E5EA] rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Consultas de clientes */}
            <Link
              href="/admin/metricas?tab=consultas"
              className="bg-white border border-[#E5E5EA] hover:border-[#007AFF]/40 active:scale-[0.98] p-4 rounded-3xl shadow-2xs flex flex-col justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#86868B]">
                  Consultas WhatsApp
                </span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-sm">
                  {stats.inquiriesCount}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#1D1D1F] tracking-tight block">
                  {stats.inquiriesCount} {stats.inquiriesCount === 1 ? "consulta" : "consultas"}
                </span>
                <span className="text-[11px] text-[#007AFF] font-semibold mt-0.5 inline-flex items-center gap-1">
                  Ver clientes interesados →
                </span>
              </div>
            </Link>

            {/* Card 2: Productos Sin Stock */}
            <Link
              href="/admin/productos?status=OUT_OF_STOCK"
              className={`border active:scale-[0.98] p-4 rounded-3xl shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${stats.outOfStockCount > 0
                ? "bg-amber-50/60 border-amber-200 hover:border-amber-300"
                : "bg-white border-[#E5E5EA]"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#86868B]">
                  Piezas Sin Stock
                </span>
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${stats.outOfStockCount > 0
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {stats.outOfStockCount}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#1D1D1F] tracking-tight block">
                  {stats.outOfStockCount} {stats.outOfStockCount === 1 ? "pieza" : "piezas"}
                </span>
                <span
                  className={`text-[11px] font-semibold mt-0.5 inline-flex items-center gap-1 ${stats.outOfStockCount > 0 ? "text-amber-800" : "text-[#86868B]"
                    }`}
                >
                  {stats.outOfStockCount > 0 ? "Reponer o marcar visible →" : "Catálogo al día →"}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* ── Refuerzo Positivo: Todo al día ───────────────────────────────── */}
        {!loading && allClear && (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900 leading-tight">
                ¡Tu vidriera está 100% al día!
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                No tenés productos sin stock ni pendientes urgentes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. RESUMEN RÁPIDO DEL CATÁLOGO ────────────────────────────────── */}
      <div className="flex flex-col gap-3 mt-1">
        <h2 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider px-1">
          Estado del Catálogo
        </h2>

        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-2xs flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-[#E5E5EA]">
            <div>
              <span className="text-2xl font-bold text-[#1D1D1F] block">
                {stats.totalProductsCount}
              </span>
              <span className="text-[11px] font-medium text-[#86868B]">
                Total Piezas
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-emerald-600 block">
                {stats.activeProductsCount}
              </span>
              <span className="text-[11px] font-medium text-[#86868B]">
                En Vidriera
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-400 block">
                {stats.draftProductsCount}
              </span>
              <span className="text-[11px] font-medium text-[#86868B]">
                Ocultos
              </span>
            </div>
          </div>

          <div className="border-t border-[#E5E5EA] pt-3 flex items-center justify-between">
            <Link
              href="/admin/productos"
              className="w-full py-2.5 bg-[#F5F5F7] hover:bg-gray-200/80 active:scale-[0.98] text-[#1D1D1F] text-xs font-semibold rounded-xl text-center transition-all cursor-pointer"
            >
              Gestionar Catálogo de Joyas →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. ACCESOS DIRECTOS SECUNDARIOS ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/categorias"
          className="bg-white border border-[#E5E5EA] p-4 rounded-2xl shadow-2xs hover:border-gray-300 active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#1D1D1F]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-[#1D1D1F] block">Categorías</span>
            <span className="text-[10px] text-[#86868B]">Organizar menú</span>
          </div>
        </Link>

        <Link
          href="/admin/configuracion"
          className="bg-white border border-[#E5E5EA] p-4 rounded-2xl shadow-2xs hover:border-gray-300 active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#1D1D1F]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-[#1D1D1F] block">Ajustes</span>
            <span className="text-[10px] text-[#86868B]">Datos y tienda</span>
          </div>
        </Link>
      </div>

    </div>
  );
}

