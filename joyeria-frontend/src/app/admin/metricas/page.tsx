"use client";

/**
 * app/admin/metricas/page.tsx
 * Panel de Métricas de Negocio, Registro de Consultas, Auditoría del Sistema y Control de Módulos.
 *
 * Diseñado bajo las directivas de Apple Human Interface Guidelines:
 * - Cero emojis, iconografía SVG lineal y tipografía balanceada SF Pro.
 * - Registro de auditoría completo con fecha, hora, minuto y segundo exacto.
 * - Módulos monetizables con control de acceso por feature flags.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminFetch, getUser } from "@/lib/auth";
import {
  getFeatureFlags,
  setFeatureFlag,
  isDevModeActive,
  type FeatureFlags,
} from "@/lib/featureFlags";
import { useToast } from "@/hooks/useToast";

interface AdminProduct {
  id: string;
  name: string;
  price: string | null;
  showPrice: boolean;
  status: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";
  category: { id: string; name: string; slug: string; parent?: { id: string; name: string; slug: string } | null };
  images: { url: string }[];
}

interface InquiryItem {
  id: string;
  productName: string;
  variantName: string | null;
  priceSnapshot: string | number | null;
  createdAt: string;
}

interface InquiryStats {
  totalInquiries: number;
  topProducts: Array<{
    productId: string | null;
    productName: string;
    inquiryCount: number;
  }>;
}

interface InquiriesResponse {
  items: InquiryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

interface AuditLogsResponse {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatCurrency(num: number): string {
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

// Formato de auditoría con fecha y hora exacta con segundos: DD/MM/AAAA HH:mm:ss
function formatExactAuditDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getActionBadgeStyle(action: string) {
  if (action.includes("CREATE") || action.includes("UPLOAD")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
  }
  if (action.includes("DELETE")) {
    return "bg-rose-50 text-rose-800 border-rose-200/80";
  }
  if (action.includes("UPDATE") || action.includes("REORDER")) {
    return "bg-blue-50 text-blue-800 border-blue-200/80";
  }
  if (action.includes("LOGIN")) {
    return "bg-purple-50 text-purple-800 border-purple-200/80";
  }
  return "bg-gray-50 text-gray-700 border-gray-200/80";
}

export default function AdminMetricasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"resumen" | "consultas" | "auditoria" | "modulos">("resumen");
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());
  const [devMode, setDevState] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Datos comerciales y de consultas
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [inquiryStats, setInquiryStats] = useState<InquiryStats | null>(null);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryTotalPages, setInquiryTotalPages] = useState(1);
  const [inquiryTotalCount, setInquiryTotalCount] = useState(0);

  // Datos de auditoría
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditEntityType, setAuditEntityType] = useState("");

  const [loading, setLoading] = useState(true);

  // Inicialización y Guardia de Acceso
  useEffect(() => {
    const user = getUser();
    const currentFlags = getFeatureFlags();
    const isDev = isDevModeActive() || user?.email === "webya@joyeriapetrucci.com";

    setDevState(isDev);
    setFlags(currentFlags);

    // Si no es el desarrollador y el módulo no está activado para el cliente, redirigir
    if (!isDev && !currentFlags.metricsModule && !currentFlags.auditModule) {
      router.replace("/admin/productos");
      return;
    }

    setIsAuthorized(true);

    const initialTab = searchParams.get("tab");
    if (initialTab === "consultas" || initialTab === "auditoria" || initialTab === "modulos") {
      setActiveTab(initialTab);
    }
  }, [router, searchParams]);

  // Carga de datos comerciales
  const loadCommercialData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [prodRes, inqRes, statsRes] = await Promise.all([
        adminFetch<{ items: AdminProduct[] }>("/admin/products?limit=100"),
        adminFetch<InquiriesResponse>(`/admin/inquiries?page=${page}&limit=20`),
        adminFetch<InquiryStats>("/admin/inquiries/stats"),
      ]);

      setProducts(prodRes.items || []);
      setInquiries(inqRes.items || []);
      setInquiryTotalCount(inqRes.pagination?.total || 0);
      setInquiryTotalPages(inqRes.pagination?.totalPages || 1);
      setInquiryPage(inqRes.pagination?.page || 1);
      setInquiryStats(statsRes);
    } catch {
      toast.error("No se pudieron cargar las métricas.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carga de logs de auditoría
  const loadAuditData = useCallback(async (page = 1, search = "", entityType = "") => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "25",
        ...(search ? { search } : {}),
        ...(entityType ? { entityType } : {}),
      });

      const res = await adminFetch<AuditLogsResponse>(`/admin/audit-logs?${query.toString()}`);
      setAuditLogs(res.items || []);
      setAuditTotalCount(res.pagination?.total || 0);
      setAuditTotalPages(res.pagination?.totalPages || 1);
      setAuditPage(res.pagination?.page || 1);
    } catch {
      // Error silencioso si no tiene permisos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadCommercialData(1);
      if (devMode || flags.auditModule) {
        loadAuditData(1, auditSearch, auditEntityType);
      }
    }
  }, [isAuthorized, devMode, flags.auditModule, loadCommercialData, loadAuditData, auditSearch, auditEntityType]);

  // Cálculos de resumen
  const summary = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "ACTIVE");

    const activePrices = active
      .map((p) => (p.price ? Number(p.price) : 0))
      .filter((n) => n > 0);

    const totalValuation = activePrices.reduce((a, b) => a + b, 0);
    const avgPrice = activePrices.length > 0 ? totalValuation / activePrices.length : 0;
    const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
    const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;

    const inquiriesWithValue = inquiries
      .map((i) => (i.priceSnapshot ? Number(i.priceSnapshot) : 0))
      .filter((n) => n > 0);
    const totalInquiryValue = inquiriesWithValue.reduce((a, b) => a + b, 0);

    const categoriesMap: Record<string, { count: number; value: number }> = {};
    active.forEach((p) => {
      const catName = p.category?.parent?.name || p.category?.name || "Sin Categoría";
      if (!categoriesMap[catName]) {
        categoriesMap[catName] = { count: 0, value: 0 };
      }
      categoriesMap[catName].count += 1;
      categoriesMap[catName].value += p.price ? Number(p.price) : 0;
    });

    const categoryBreakdown = Object.entries(categoriesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      activeCount: active.length,
      totalValuation,
      avgPrice,
      maxPrice,
      minPrice,
      totalInquiries: inquiryStats?.totalInquiries ?? inquiryTotalCount,
      totalInquiryValue,
      categoryBreakdown,
    };
  }, [products, inquiries, inquiryStats, inquiryTotalCount]);

  const handleToggleFlag = (key: keyof FeatureFlags) => {
    const newVal = !flags[key];
    setFeatureFlag(key, newVal);
    setFlags(getFeatureFlags());
    toast.success(newVal ? `Módulo activado.` : `Módulo desactivado.`);
  };

  // Función para exportar la bitácora de auditoría a CSV
  const handleExportAuditCsv = () => {
    if (auditLogs.length === 0) {
      toast.error("No hay registros de auditoría para exportar.");
      return;
    }

    const headers = ["Fecha y Hora Exacta", "Usuario", "Email", "Accion", "Tipo Entidad", "ID Entidad", "Descripcion"];
    const rows = auditLogs.map((log) => [
      `"${formatExactAuditDate(log.createdAt)}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${(log.userEmail || "").replace(/"/g, '""')}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.entityType.replace(/"/g, '""')}"`,
      `"${(log.entityId || "").replace(/"/g, '""')}"`,
      `"${log.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_petrucci_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Bitácora de auditoría exportada exitosamente.");
  };

  const handleCopyProposal = (moduleName: string, price: string, description: string) => {
    const text = `Hola Víctor! Te paso el detalle del nuevo módulo disponible para el panel de Joyería Petrucci:\n\n*${moduleName}*\n${description}\n\n*Inversión mensual:* ${price}\n\nSi te interesa lo dejamos activo hoy mismo en tu panel. Saludos!`;
    navigator.clipboard.writeText(text);
    toast.success("Propuesta copiada al portapapeles para WhatsApp.");
  };

  if (!isAuthorized) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto font-sans text-[#1D1D1F] pb-20">
      {/* ── Encabezado Principal ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] tracking-tight">
              Métricas y Rendimiento
            </h1>
            {devMode && (
              <span className="px-2 py-0.5 bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] text-[10px] font-semibold uppercase tracking-wider rounded-md">
                Admin Dev
              </span>
            )}
          </div>
          <p className="text-xs text-[#86868B] mt-0.5 font-normal">
            Seguimiento de consultas, valuación de catálogo y trazabilidad del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "auditoria") {
              loadAuditData(auditPage, auditSearch, auditEntityType);
            } else {
              loadCommercialData(inquiryPage);
            }
          }}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-gray-50 active:scale-[0.98] border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── Segmented Control (Tabs Estilo iOS) ───────────────────────────── */}
      <div className="p-1 bg-[#E5E5EA]/70 rounded-xl flex items-center gap-1 self-start select-none overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("resumen")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "resumen"
              ? "bg-white text-[#1D1D1F] shadow-xs"
              : "text-[#86868B] hover:text-[#1D1D1F]"
          }`}
        >
          Resumen Comercial
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("consultas")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "consultas"
              ? "bg-white text-[#1D1D1F] shadow-xs"
              : "text-[#86868B] hover:text-[#1D1D1F]"
          }`}
        >
          <span>Consultas WhatsApp</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#F5F5F7] text-[#86868B] rounded-full font-medium">
            {summary.totalInquiries}
          </span>
        </button>

        {(devMode || flags.auditModule) && (
          <button
            type="button"
            onClick={() => setActiveTab("auditoria")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === "auditoria"
                ? "bg-white text-[#007AFF] shadow-xs"
                : "text-[#86868B] hover:text-[#007AFF]"
            }`}
          >
            <span>Auditoría del Sistema</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-[#007AFF] rounded-full font-semibold">
              {auditTotalCount}
            </span>
          </button>
        )}

        {devMode && (
          <button
            type="button"
            onClick={() => setActiveTab("modulos")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "modulos"
                ? "bg-white text-[#007AFF] shadow-xs"
                : "text-[#86868B] hover:text-[#007AFF]"
            }`}
          >
            Módulos & Facturación
          </button>
        )}
      </div>

      {/* ── TAB 1: RESUMEN COMERCIAL ──────────────────────────────────────── */}
      {activeTab === "resumen" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                Valuación Catálogo
              </span>
              <div className="my-2">
                <span className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                  {formatCurrency(summary.totalValuation)}
                </span>
              </div>
              <span className="text-[11px] text-[#86868B]">
                {summary.activeCount} piezas activas en stock
              </span>
            </div>

            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                Ticket Promedio
              </span>
              <div className="my-2">
                <span className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                  {formatCurrency(summary.avgPrice)}
                </span>
              </div>
              <span className="text-[11px] text-[#86868B]">
                Rango: {formatCurrency(summary.minPrice)} – {formatCurrency(summary.maxPrice)}
              </span>
            </div>

            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                Consultas WhatsApp
              </span>
              <div className="my-2">
                <span className="text-2xl font-semibold text-[#007AFF] tracking-tight">
                  {summary.totalInquiries}
                </span>
              </div>
              <span className="text-[11px] text-[#86868B]">
                Intenciones de compra registradas
              </span>
            </div>

            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                Interés Comercial
              </span>
              <div className="my-2">
                <span className="text-2xl font-semibold text-emerald-700 tracking-tight">
                  {formatCurrency(summary.totalInquiryValue)}
                </span>
              </div>
              <span className="text-[11px] text-[#86868B]">
                Snapshot acumulado en consultas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-[#1D1D1F]">
                Distribución por Tipo de Joya
              </h2>

              <div className="flex flex-col gap-3">
                {summary.categoryBreakdown.map((cat) => {
                  const pct = summary.activeCount > 0 ? (cat.count / summary.activeCount) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1D1D1F]">{cat.name}</span>
                        <span className="text-[#86868B]">
                          {cat.count} piezas ({Math.round(pct)}%) · {formatCurrency(cat.value)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1D1D1F]">
                  Piezas Más Consultadas
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("consultas")}
                  className="text-xs font-medium text-[#007AFF] hover:underline cursor-pointer"
                >
                  Ver registro completo →
                </button>
              </div>

              {inquiryStats?.topProducts && inquiryStats.topProducts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {inquiryStats.topProducts.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.productId ?? idx}
                      className="p-2.5 bg-[#F5F5F7]/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-[#1D1D1F] truncate">
                          {item.productName}
                        </span>
                      </div>
                      <span className="font-semibold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                        {item.inquiryCount} {item.inquiryCount === 1 ? "consulta" : "consultas"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#86868B]">
                  Aún no se registraron consultas directas de clientes.
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── TAB 2: CONSULTAS DE WHATSAPP ──────────────────────────────────── */}
      {activeTab === "consultas" && (
        <section className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1D1D1F]">
                Historial de Consultas de WhatsApp
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Registro de clientes que hicieron clic en &quot;Consultar por WhatsApp&quot; en la tienda.
              </p>
            </div>
            <span className="text-xs font-medium text-[#86868B]">
              {inquiryTotalCount} registros
            </span>
          </div>

          {loading && inquiries.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#86868B]">Cargando registro…</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-sm font-medium text-[#1D1D1F]">No hay consultas registradas</p>
              <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                Las intenciones de compra y consultas de clientes desde la tienda pública aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7]/60 text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Fecha y Hora</th>
                      <th className="py-2.5 px-4">Pieza</th>
                      <th className="py-2.5 px-4">Variante</th>
                      <th className="py-2.5 px-4 text-right">Precio en Snapshot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {inquiries.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">
                          {formatExactAuditDate(item.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1D1D1F]">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4">
                          {item.variantName ? (
                            <span className="bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded-md font-medium text-[11px]">
                              {item.variantName}
                            </span>
                          ) : (
                            <span className="text-[#86868B]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#1D1D1F]">
                          {item.priceSnapshot ? `$${Number(item.priceSnapshot).toLocaleString("es-AR")}` : "A consultar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[#E5E5EA]">
                {inquiries.map((item) => (
                  <div key={item.id} className="p-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#86868B]">
                      <span>{formatExactAuditDate(item.createdAt)}</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {item.priceSnapshot ? `$${Number(item.priceSnapshot).toLocaleString("es-AR")}` : "A consultar"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1D1D1F]">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <span className="bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded-md font-medium text-[10px] shrink-0">
                          {item.variantName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {inquiryTotalPages > 1 && (
                <div className="p-3 border-t border-[#E5E5EA] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={inquiryPage <= 1}
                    onClick={() => loadCommercialData(inquiryPage - 1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-[#86868B]">
                    Página {inquiryPage} de {inquiryTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={inquiryPage >= inquiryTotalPages}
                    onClick={() => loadCommercialData(inquiryPage + 1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── TAB 3: AUDITORÍA DEL SISTEMA (MONETIZABLE) ────────────────────── */}
      {activeTab === "auditoria" && (devMode || flags.auditModule) && (
        <section className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#1D1D1F]">
                  Registro de Auditoría en Tiempo Real
                </h2>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-semibold rounded-md border border-purple-200/80">
                  Exacto con Segundos
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Bitácora cronológica inmutable de todas las acciones, cambios y accesos del sistema.
              </p>
            </div>

            {/* Filtros y Exportación */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Buscar en logs…"
                className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-normal text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] w-36 sm:w-44"
              />

              <select
                value={auditEntityType}
                onChange={(e) => setAuditEntityType(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-normal text-[#1D1D1F] focus:outline-none focus:border-[#007AFF]"
              >
                <option value="">Todas las entidades</option>
                <option value="Product">Productos</option>
                <option value="Variant">Variantes</option>
                <option value="Media">Fotos / Media</option>
                <option value="Category">Categorías</option>
                <option value="StoreConfig">Ajustes Tienda</option>
                <option value="Auth">Inicios de Sesión</option>
                <option value="Inquiry">Consultas WhatsApp</option>
              </select>

              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-gray-200 border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Descargar registro en archivo CSV"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 11v3h12v-3M8 2v9M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Exportar CSV
              </button>
            </div>
          </div>

          {loading && auditLogs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#86868B]">Cargando bitácora de auditoría…</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-sm font-medium text-[#1D1D1F]">No hay eventos registrados con estos filtros</p>
              <p className="text-xs text-[#86868B] mt-1">
                Todas las modificaciones quedarán guardadas automáticamente aquí.
              </p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7]/60 text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                      <th className="py-2.5 px-4 whitespace-nowrap">Fecha y Hora Exacta</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Usuario</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Acción</th>
                      <th className="py-2.5 px-4">Descripción de la Actividad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#515154] whitespace-nowrap">
                          {formatExactAuditDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1D1D1F]">
                              {log.userName}
                            </span>
                            {log.userEmail && (
                              <span className="text-[10px] text-[#86868B] font-mono">
                                {log.userEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border ${getActionBadgeStyle(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#1D1D1F] leading-relaxed">
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {auditTotalPages > 1 && (
                <div className="p-3 border-t border-[#E5E5EA] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => loadAuditData(auditPage - 1, auditSearch, auditEntityType)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-[#86868B]">
                    Página {auditPage} de {auditTotalPages} ({auditTotalCount} eventos)
                  </span>
                  <button
                    type="button"
                    disabled={auditPage >= auditTotalPages}
                    onClick={() => loadAuditData(auditPage + 1, auditSearch, auditEntityType)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── TAB 4: MÓDULOS & FACTURACIÓN (CONTROL EXCLUSIVO DESARROLLADOR WEBYA) ── */}
      {activeTab === "modulos" && devMode && (
        <section className="bg-white border border-[#E5E5EA] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5EA] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#1D1D1F]">
                  Gestión de Módulos Facturables & Upgrades
                </h2>
                <span className="px-2 py-0.5 bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-semibold rounded-md border border-[#007AFF]/20">
                  Control WebYa
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Activá o desactivá cada servicio para Víctor con un clic según lo que contrate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta 1: AUDITORÍA DE SEGURIDAD TOTAL (FACTURABLE) */}
            <div className="p-4 bg-[#F5F5F7]/80 rounded-2xl border border-[#E5E5EA] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  
                  <button
                    type="button"
                    onClick={() => handleToggleFlag("auditModule")}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      flags.auditModule ? "bg-[#007AFF]" : "bg-gray-300"
                    }`}
                    title={flags.auditModule ? "Desactivar módulo" : "Activar módulo"}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform transform shadow-sm ${
                        flags.auditModule ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] mt-1">
                  Auditoría Completa y Trazabilidad de Seguridad
                </h3>
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                  Registro cronológico exacto al segundo de todos los cambios de precios, stock, fotos, creaciones, ediciones e inicios de sesión. Incluye exportación a CSV.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Sugerido: <span className="font-semibold text-purple-700">$35.000 / mes</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyProposal(
                      "Módulo de Auditoría y Trazabilidad de Seguridad",
                      "$35.000 ARS/mes",
                      "Permite auditar minuto a minuto cualquier cambio en precios, catálogo, fotos y accesos del personal en tu panel con descarga en Excel/CSV."
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-[#E5E5EA] rounded-lg text-[10px] font-medium text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Copiar Propuesta WhatsApp
                </button>
              </div>
            </div>

            {/* Tarjeta 2: MÉTRICAS Y CONSULTAS WHATSAPP (FACTURABLE) */}
            <div className="p-4 bg-[#F5F5F7]/80 rounded-2xl border border-[#E5E5EA] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  
                  <button
                    type="button"
                    onClick={() => handleToggleFlag("metricsModule")}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      flags.metricsModule ? "bg-[#007AFF]" : "bg-gray-300"
                    }`}
                    title={flags.metricsModule ? "Desactivar módulo" : "Activar módulo"}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform transform shadow-sm ${
                        flags.metricsModule ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] mt-1">
                  Métricas Comerciales & Consultas WhatsApp
                </h3>
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                  Panel de intenciones de compra, productos con más demanda, tasa de conversión y registro de cada consulta directa de WhatsApp.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Sugerido: <span className="font-semibold text-blue-700">$40.000 / mes</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyProposal(
                      "Módulo de Métricas y Consultas WhatsApp",
                      "$40.000 ARS/mes",
                      "Acceso en tiempo real a las métricas de qué piezas consultan los clientes por WhatsApp y qué joyas generan mayor interés comercial."
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-[#E5E5EA] rounded-lg text-[10px] font-medium text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Copiar Propuesta WhatsApp
                </button>
              </div>
            </div>

            {/* Tarjeta 3: VALUACIÓN DE STOCK EN TIEMPO REAL */}
            <div className="p-4 bg-[#F5F5F7]/80 rounded-2xl border border-[#E5E5EA] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  
                  <button
                    type="button"
                    onClick={() => handleToggleFlag("inventoryValuation")}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      flags.inventoryValuation ? "bg-[#007AFF]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform transform shadow-sm ${
                        flags.inventoryValuation ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] mt-1">
                  Valuación Económica de Stock
                </h3>
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                  Cálculo automático y actualizado del capital total inmovilizado en el catálogo y desglose por categorías.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Sugerido: <span className="font-semibold text-emerald-700">$25.000 / mes</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyProposal(
                      "Módulo de Valuación de Stock en ARS",
                      "$25.000 ARS/mes",
                      "Visualización automática del valor total del inventario de la joyería en tiempo real para balances."
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-[#E5E5EA] rounded-lg text-[10px] font-medium text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Copiar Propuesta WhatsApp
                </button>
              </div>
            </div>

            {/* Tarjeta 4: EXPORTACIÓN EXCEL / CSV */}
            <div className="p-4 bg-[#F5F5F7]/80 rounded-2xl border border-[#E5E5EA] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  
                  <button
                    type="button"
                    onClick={() => handleToggleFlag("exportCsv")}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      flags.exportCsv ? "bg-[#007AFF]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform transform shadow-sm ${
                        flags.exportCsv ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] mt-1">
                  Exportación de Catálogo a Excel / CSV
                </h3>
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                  Descarga instantánea de todo el inventario con códigos, variantes y precios para administración contable.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#1D1D1F]">
                  Sugerido: <span className="font-semibold text-amber-700">$20.000 / mes</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyProposal(
                      "Módulo de Exportación a Excel",
                      "$20.000 ARS/mes",
                      "Descarga en un clic de todo el catálogo para contabilidad, balances y copias de seguridad."
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-[#E5E5EA] rounded-lg text-[10px] font-medium text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Copiar Propuesta WhatsApp
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
