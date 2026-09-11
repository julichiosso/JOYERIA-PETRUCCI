"use client";

/**
 * app/admin/configuracion/page.tsx
 * Configuración de la tienda: nombre, WhatsApp, horarios, dirección, redes.
 *
 * PATCH /admin/store-config con los campos que el dueño puede editar.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";

interface StoreConfigAdmin {
  storeName: string;
  whatsappNumber: string;
  whatsappMessageTemplate: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  businessHours: string | null;
  returnPolicy: string | null;
  shippingInfo: string | null;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

const inputClass =
  "w-full px-4 py-3 bg-[#F5F5F7] border border-gray-200/80 rounded-2xl font-sans text-sm font-semibold text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-0 focus:border-gray-400 transition-all";

export default function AdminConfiguracionPage() {
  const router = useRouter();
  const [form, setForm] = useState<StoreConfigAdmin>({
    storeName: "",
    whatsappNumber: "",
    whatsappMessageTemplate: "",
    instagramUrl: "",
    facebookUrl: "",
    address: "",
    businessHours: "",
    returnPolicy: "",
    shippingInfo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch<StoreConfigAdmin>("/admin/store-config")
      .then((data) => {
        setForm({
          storeName: data.storeName ?? "",
          whatsappNumber: data.whatsappNumber ?? "",
          whatsappMessageTemplate: data.whatsappMessageTemplate ?? "",
          instagramUrl: data.instagramUrl ?? "",
          facebookUrl: data.facebookUrl ?? "",
          address: data.address ?? "",
          businessHours: data.businessHours ?? "",
          returnPolicy: data.returnPolicy ?? "",
          shippingInfo: data.shippingInfo ?? "",
        });
        setLoading(false);
      })
      .catch((err: { status?: number; message?: string }) => {
        if (err.status === 401) {
          router.push("/admin/login");
        } else {
          setError(err.message ?? "No se pudo cargar la configuración.");
          setLoading(false);
        }
      });
  }, [router]);

  const set = (key: keyof StoreConfigAdmin) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await adminFetch("/admin/store-config", {
        method: "PATCH",
        body: JSON.stringify({
          storeName: form.storeName || undefined,
          whatsappNumber: form.whatsappNumber || undefined,
          whatsappMessageTemplate: form.whatsappMessageTemplate || undefined,
          instagramUrl: form.instagramUrl || null,
          facebookUrl: form.facebookUrl || null,
          address: form.address || null,
          businessHours: form.businessHours || null,
          returnPolicy: form.returnPolicy || null,
          shippingInfo: form.shippingInfo || null,
        }),
      });
      setSaved(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-gray-200/80">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-4xl font-sans pb-16">
      <div>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">Ajustes de la Tienda</h1>
        <p className="font-sans text-sm text-gray-500 mt-1">
          Datos públicos visibles en la tienda, links de WhatsApp y redes sociales.
        </p>
      </div>

      {/* ── Datos principales ─────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="font-sans text-base font-bold text-[#1D1D1F]">Datos del negocio</h2>

        <div>
          <FieldLabel htmlFor="store-name">Nombre de la tienda</FieldLabel>
          <input id="store-name" type="text" value={form.storeName} onChange={set("storeName")} placeholder="Petrucci Joyería" className={inputClass} />
        </div>

        <div>
          <FieldLabel htmlFor="store-address">Dirección</FieldLabel>
          <input id="store-address" type="text" value={form.address ?? ""} onChange={set("address")} placeholder="Eva Perón 1574, San Jorge, Santa Fe" className={inputClass} />
        </div>

        <div>
          <FieldLabel htmlFor="store-hours">Horarios de atención</FieldLabel>
          <input id="store-hours" type="text" value={form.businessHours ?? ""} onChange={set("businessHours")} placeholder="Lun–Vie 9:00–18:00 · Sáb 9:00–13:00" className={inputClass} />
        </div>
      </section>

      {/* ── WhatsApp ──────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="font-sans text-base font-bold text-[#1D1D1F]">WhatsApp</h2>

        <div>
          <FieldLabel htmlFor="wa-number">Número de WhatsApp</FieldLabel>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm font-semibold text-gray-400">+</span>
            <input
              id="wa-number"
              type="tel"
              value={form.whatsappNumber}
              onChange={set("whatsappNumber")}
              placeholder="5493408000000"
              className={`${inputClass} pl-8`}
            />
          </div>
          <p className="mt-2 font-sans text-xs text-gray-400">
            Código de país + número completo sin espacios. Ej: 5493408123456
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="wa-template">Mensaje por defecto (opcional)</FieldLabel>
          <textarea
            id="wa-template"
            value={form.whatsappMessageTemplate ?? ""}
            onChange={set("whatsappMessageTemplate")}
            rows={3}
            placeholder="Hola Petrucci Joyería! Quisiera consultar sobre el producto {nombre} (${precio}). {url}"
            className={`${inputClass} resize-none`}
          />
          <p className="mt-2 font-sans text-xs text-gray-400">
            Variables disponibles: <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded-lg text-gray-600 font-mono">{"{nombre}"}</code>, <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded-lg text-gray-600 font-mono">{"{precio}"}</code>, <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded-lg text-gray-600 font-mono">{"{url}"}</code>
          </p>
        </div>
      </section>

      {/* ── Redes sociales ────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="font-sans text-base font-bold text-[#1D1D1F]">Redes sociales</h2>

        <div>
          <FieldLabel htmlFor="instagram">Instagram (URL completa)</FieldLabel>
          <input id="instagram" type="url" value={form.instagramUrl ?? ""} onChange={set("instagramUrl")} placeholder="https://instagram.com/joyeriapetrucci" className={inputClass} />
        </div>

        <div>
          <FieldLabel htmlFor="facebook">Facebook (URL completa)</FieldLabel>
          <input id="facebook" type="url" value={form.facebookUrl ?? ""} onChange={set("facebookUrl")} placeholder="https://facebook.com/joyeriapetrucci" className={inputClass} />
        </div>
      </section>

      {/* ── Políticas ─────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="font-sans text-base font-bold text-[#1D1D1F]">Información para clientes</h2>

        <div>
          <FieldLabel htmlFor="returns">Política de devoluciones</FieldLabel>
          <textarea id="returns" value={form.returnPolicy ?? ""} onChange={set("returnPolicy")} rows={3} placeholder="Para cambios o devoluciones comunicarse dentro de los 7 días…" className={`${inputClass} resize-none`} />
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 font-sans text-xs text-red-700 font-semibold">
          {error}
        </div>
      )}

      {saved && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 font-sans text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          ¡Ajustes guardados con éxito!
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto px-8 py-3.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-sans text-sm font-semibold rounded-2xl transition-all shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            "Guardar ajustes"
          )}
        </button>
      </div>
    </form>
  );
}
