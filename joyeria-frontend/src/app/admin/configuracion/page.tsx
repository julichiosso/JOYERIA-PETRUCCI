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
    <label htmlFor={htmlFor} className="block font-body text-xs tracking-wide text-gray-700 font-medium mb-1.5">
      {children}
    </label>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-300 rounded-md font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors";

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
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h1 className="font-body text-xl font-semibold text-gray-900">Configuración de la tienda</h1>
        <p className="font-body text-xs text-gray-500 mt-1">
          Estos datos aparecen en el footer, en los links de WhatsApp y en el SEO del sitio.
        </p>
      </div>

      {/* ── Datos principales ─────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900">Datos del negocio</h2>

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
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900">WhatsApp</h2>

        <div>
          <FieldLabel htmlFor="wa-number">Número de WhatsApp</FieldLabel>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-body text-sm text-gray-500">+</span>
            <input
              id="wa-number"
              type="tel"
              value={form.whatsappNumber}
              onChange={set("whatsappNumber")}
              placeholder="5493408000000"
              className={`${inputClass} pl-7`}
            />
          </div>
          <p className="mt-1 font-body text-xs text-gray-500">
            Código de país + número completo sin espacios. Ej: 5493408123456 (Argentina 549 + área + número)
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
          <p className="mt-1 font-body text-xs text-gray-500">
            Variables disponibles: <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{precio}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{url}"}</code>
          </p>
        </div>
      </section>

      {/* ── Redes sociales ────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900">Redes sociales</h2>

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
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900">Información para clientes</h2>

        <div>
          <FieldLabel htmlFor="shipping">Información de envíos</FieldLabel>
          <textarea id="shipping" value={form.shippingInfo ?? ""} onChange={set("shippingInfo")} rows={3} placeholder="Hacemos envíos a todo el país por correo o mensajería…" className={`${inputClass} resize-none`} />
        </div>

        <div>
          <FieldLabel htmlFor="returns">Política de devoluciones</FieldLabel>
          <textarea id="returns" value={form.returnPolicy ?? ""} onChange={set("returnPolicy")} rows={3} placeholder="Para cambios o devoluciones comunicarse dentro de los 7 días…" className={`${inputClass} resize-none`} />
        </div>
      </section>

      {/* ── Feedback + Submit ─────────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-md px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div role="status" className="bg-green-50 border border-green-200 rounded-md px-4 py-3 font-body text-sm text-green-800 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          ¡Configuración guardada con éxito!
        </div>
      )}

      <div className="pb-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-body text-sm rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            "Guardar configuración"
          )}
        </button>
      </div>
    </form>
  );
}
