"use client";

/**
 * components/admin/ProductForm.tsx
 * Formulario inteligente para crear y editar piezas con sugerencias automáticas de SEO,
 * formateo visual de precios sin salto de cursor, indicador de pasos y botones adaptativos.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, adminFetchMultipart } from "@/lib/auth";
import type { AdminApiError } from "@/lib/auth";
import ImageUploader, { type LocalProductImage } from "./ImageUploader";
import VariantManager from "./VariantManager";
import type { Category } from "@/types/category";
import { useToast } from "@/hooks/useToast";

type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  status: ProductStatus;
  price: string; // Guarda los dígitos puros (ej: "1850000")
  showPrice: boolean;
  variantLabel: string;
  metaTitle: string;
  metaDescription: string;
}

interface InitialProductData extends ProductFormData {
  id: string;
  images: LocalProductImage[];
}

interface ProductFormProps {
  initialData?: InitialProductData;
}

const STATUS_OPTIONS: { value: ProductStatus; label: string; desc: string }[] = [
  { value: "ACTIVE", label: "Activo (Visible en tienda)", desc: "Visible en la tienda" },
  { value: "DRAFT", label: "Borrador (Oculto)", desc: "Oculto" },
  { value: "OUT_OF_STOCK", label: "Sin stock (Agotado)", desc: "Badge de agotado" },
];

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-sans">
      {children} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
  );
}

function inputClass(error?: boolean) {
  return `w-full px-4 py-3.5 bg-[#F5F5F7] border ${error ? "border-red-500 bg-red-50/40" : "border-gray-200/80"} rounded-2xl text-base font-semibold text-[#1D1D1F] placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-sans`;
}

// Función helper para formatear miles visualmente
function formatPriceDisplay(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = Boolean(initialData?.id);

  // Inicializar price como dígitos puros
  const initialPriceDigits = initialData?.price ? String(initialData.price).replace(/\D/g, "") : "";

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    categoryId: initialData?.categoryId ?? "",
    status: initialData?.status ?? "ACTIVE",
    price: initialPriceDigits,
    showPrice: initialData?.showPrice ?? false,
    variantLabel: initialData?.variantLabel ?? "",
    metaTitle: initialData?.metaTitle ?? "",
    metaDescription: initialData?.metaDescription ?? "",
  });

  const [images, setImages] = useState<LocalProductImage[]>(initialData?.images ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [appliedSuggestion, setAppliedSuggestion] = useState(false);

  // Cargar categorías
  useEffect(() => {
    adminFetch<Category[] | { categories: Category[] }>("/admin/categories")
      .then((res) => {
        const cats = Array.isArray(res) ? res : res?.categories || [];
        setCategories(cats);
      })
      .catch(() => setCategories([]));
  }, []);

  const set = (key: keyof ProductFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Manejador especializado de precio con formateo en vivo y preservación de cursor
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const selectionStart = inputEl.selectionStart ?? 0;
    const oldValue = inputEl.value;

    // Conteo de dígitos antes del cursor en el texto modificado
    const digitsBeforeCursor = oldValue.slice(0, selectionStart).replace(/\D/g, "").length;

    const rawDigits = oldValue.replace(/\D/g, "");
    const formatted = formatPriceDisplay(rawDigits);

    setFormData((prev) => ({ ...prev, price: rawDigits }));
    setFieldErrors((prev) => ({ ...prev, price: undefined }));

    // Preservar la posición exacta del cursor después del formateo
    requestAnimationFrame(() => {
      if (!inputEl) return;
      let newPos = 0;
      let digitCount = 0;

      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
        if (digitCount === digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
      if (digitCount < digitsBeforeCursor || digitsBeforeCursor === 0) {
        newPos = formatted.length;
      }
      inputEl.setSelectionRange(newPos, newPos);
    });
  };

  // Asistente inteligente de SEO y descripción
  const handleAutoSuggest = () => {
    const rawName = formData.name.trim();
    if (!rawName) {
      toast.error("Ingresá primero el nombre del producto para generar sugerencias automáticas.");
      return;
    }

    const matchedCat = categories.find((c) => c.id === formData.categoryId);
    const catName = matchedCat ? matchedCat.name : "Joyería Fina";

    const autoTitle = `${rawName} | Petrucci Joyería`;
    const autoMetaDesc = `Comprá ${rawName} en Petrucci Joyería. Pieza artesanal de alta calidad, atención personalizada. Desde San Jorge, Santa Fe.`;

    let autoDesc = formData.description;
    if (!autoDesc.trim()) {
      autoDesc = `Pieza exclusiva de ${catName.toLowerCase()} elaborada con materiales de máxima pureza y acabado artesanal de alta precisión. Diseñada para lucir con elegancia y perdurar en el tiempo.\n\n• Materiales garantizados de primera calidad.\n• Incluye estuche premium de presentación Petrucci.\n• Consultanos por grabados personalizados o medidas especiales.`;
    }

    let autoVariant = formData.variantLabel;
    if (!autoVariant.trim()) {
      const lower = rawName.toLowerCase();
      if (lower.includes("anillo") || lower.includes("alianza") || lower.includes("cintillo")) {
        autoVariant = "Disponible en talles del 12 al 24 · Oro 18k o Plata 925";
      } else if (lower.includes("cadena") || lower.includes("collar") || lower.includes("gargantilla")) {
        autoVariant = "Disponible en largos de 45cm, 50cm y 60cm";
      } else if (lower.includes("pulsera") || lower.includes("esclava")) {
        autoVariant = "Medidas estándar 18cm y 20cm · Cierre reforzado";
      } else if (lower.includes("mate")) {
        autoVariant = "Virola lisa o cincelada · Grabado personalizado opcional";
      }
    }

    setFormData((prev) => ({
      ...prev,
      metaTitle: autoTitle.slice(0, 70),
      metaDescription: autoMetaDesc.slice(0, 160),
      description: autoDesc,
      variantLabel: autoVariant,
    }));

    setAppliedSuggestion(true);
    setSeoOpen(true);
    toast.success("✨ Sugerencias de descripción y SEO aplicadas con éxito.");
    setTimeout(() => setAppliedSuggestion(false), 4000);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.categoryId) errors.categoryId = "Seleccioná una categoría";
    if (formData.price && isNaN(Number(formData.price))) {
      errors.price = "El precio debe ser un número válido";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        status: formData.status,
        price: formData.price ? Number(formData.price) : undefined,
        showPrice: formData.showPrice,
        variantLabel: formData.variantLabel.trim() || undefined,
        metaTitle: formData.metaTitle.trim() || undefined,
        metaDescription: formData.metaDescription.trim() || undefined,
      };

      let productId = initialData?.id;

      if (isEditing && productId) {
        await adminFetch(`/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const created = await adminFetch<{ id: string }>("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        productId = created.id;
      }

      // Subir fotos pendientes
      const filesToUpload = images.filter((img) => img._file);
      if (filesToUpload.length > 0 && productId) {
        try {
          const fd = new FormData();
          filesToUpload.forEach((img) => {
            if (img._file) {
              fd.append("file", img._file);
              if (img.altText) {
                fd.append("altText", img.altText);
              }
            }
          });

          await adminFetchMultipart(
            `/admin/media/products/${productId}/images`,
            fd
          );
        } catch (imgErr) {
          const error = imgErr as AdminApiError;
          if (error.status === 401) {
            router.push("/admin/login");
            return;
          }
          const msg = `La joya se guardó pero hubo un problema al subir imágenes: ${error.message}`;
          setSubmitError(msg);
          toast.error(msg);
          return;
        }
      }

      toast.success(isEditing ? `"${formData.name}" guardado exitosamente` : `"${formData.name}" publicado exitosamente`);
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      const error = err as AdminApiError;
      if (error.status === 401) {
        router.push("/admin/login");
      } else {
        const msg = error.message ?? "Ocurrió un error al guardar el producto.";
        setSubmitError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Botón adaptativo de CTA según el status seleccionado
  const getCtaButton = () => {
    if (submitting) {
      return (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Guardando y procesando imágenes…
        </span>
      );
    }

    switch (formData.status) {
      case "DRAFT":
        return (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Guardar como Borrador (Oculto)
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Guardar como Sin Stock
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {isEditing ? "Guardar y Publicar Pieza" : "Publicar Joya en Tienda"}
          </span>
        );
    }
  };

  const getCtaBg = () => {
    switch (formData.status) {
      case "DRAFT":
        return "bg-amber-800 hover:bg-amber-900 text-white";
      case "OUT_OF_STOCK":
        return "bg-rose-800 hover:bg-rose-900 text-white";
      case "ACTIVE":
      default:
        return "bg-gray-900 hover:bg-gray-800 text-white";
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-2xl mx-auto font-sans text-gray-900 pb-24">

      {/* ── Encabezado Principal ────────────────────────────────────────── */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
          {isEditing ? "Editar Joya" : "Publicar Joya"}
        </h1>
      </div>

      {appliedSuggestion && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-sm font-bold text-emerald-950">
          Sugerencias de descripción y SEO aplicadas.
        </div>
      )}

      {/* ── 1. FOTO DE LA JOYA ────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-[#1D1D1F] uppercase tracking-wide font-sans">
            1. Foto de la Joya
          </h2>
          {images.length > 0 && (
            <span className="text-xs font-semibold bg-[#1D1D1F] text-white px-3 py-1 rounded-full">
              Foto lista
            </span>
          )}
        </div>

        {/* Uploader de Foto */}
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          disabled={submitting}
          productId={initialData?.id}
        />
      </section>

      {/* ── 2. DATOS DE LA JOYA ───────────────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#1D1D1F] uppercase tracking-wide border-b border-gray-100 pb-3 font-sans">
          2. Datos Básicos
        </h2>

        {/* Nombre de la Joya */}
        <div>
          <FieldLabel htmlFor="prod-name" required>
            Nombre de la Joya
          </FieldLabel>
          <input
            id="prod-name"
            type="text"
            value={formData.name}
            onChange={set("name")}
            placeholder="Ej: Anillo Alianza Oro 18k, Cadena Grumet, Reloj Seiko"
            className={inputClass(Boolean(fieldErrors.name))}
            required
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-sm text-red-600 font-extrabold">{fieldErrors.name}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <FieldLabel htmlFor="prod-category" required>
            Categoría (¿Qué tipo de joya es?)
          </FieldLabel>
          <select
            id="prod-category"
            value={formData.categoryId}
            onChange={set("categoryId")}
            className={inputClass(Boolean(fieldErrors.categoryId))}
            required
          >
            <option value="">— Tocá acá para elegir categoría —</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children && cat.children.length > 0 ? (
                  cat.children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {cat.name} › {sub.name}
                    </option>
                  ))
                ) : (
                  <option value={cat.id}>{cat.name}</option>
                )}
              </optgroup>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <p className="mt-1.5 text-sm text-red-600 font-extrabold">{fieldErrors.categoryId}</p>
          )}
        </div>

        {/* Precio en ARS */}
        <div>
          <FieldLabel htmlFor="prod-price">
            Precio en Pesos ($ ARS)
          </FieldLabel>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-black">$</span>
            <input
              id="prod-price"
              type="text"
              inputMode="numeric"
              value={formatPriceDisplay(formData.price)}
              onChange={handlePriceChange}
              placeholder="1.850.000"
              className={`${inputClass(Boolean(fieldErrors.price))} pl-9 text-xl font-extrabold text-black`}
            />
          </div>
          {fieldErrors.price && (
            <p className="mt-1.5 text-sm text-red-600 font-extrabold">{fieldErrors.price}</p>
          )}
        </div>

        {/* Toggle Mostrar Precio */}
        <div className="p-3 bg-gray-50 border border-gray-300 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.showPrice}
              onChange={(e) => setFormData((p) => ({ ...p, showPrice: e.target.checked }))}
              className="w-6 h-6 text-black rounded border-gray-400 focus:ring-black"
            />
            <div>
              <p className="text-base font-extrabold text-black leading-tight">
                Mostrar precio visible en la tienda
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Si está desactivado, el cliente verá &quot;Consultar precio por WhatsApp&quot;.
              </p>
            </div>
          </label>
        </div>

        {/* Estado en Tienda */}
        <div>
          <FieldLabel htmlFor="prod-status">
            Estado de Publicación
          </FieldLabel>
          <select
            id="prod-status"
            value={formData.status}
            onChange={set("status")}
            className={inputClass()}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción (Opcional) */}
        <div>
          <FieldLabel htmlFor="prod-desc">
            Descripción o Detalles (Opcional)
          </FieldLabel>
          <textarea
            id="prod-desc"
            value={formData.description}
            onChange={set("description")}
            rows={3}
            placeholder="Detalles sobre el metal, grabado, estuche o garantía..."
            className={`${inputClass()} resize-y text-base font-normal`}
          />
        </div>
      </section>

      {/* ── 3. VARIANTES Y PRESENTACIÓN ───────────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#1D1D1F] uppercase tracking-wide border-b border-gray-100 pb-3 font-sans">
          3. Variantes y Presentación
        </h2>

        {/* Texto de presentación de variantes */}
        <div>
          <FieldLabel htmlFor="variant-label">
            Texto de presentación de variantes
          </FieldLabel>
          <input
            id="variant-label"
            type="text"
            value={formData.variantLabel}
            onChange={set("variantLabel")}
            placeholder="Ej: Disponible en talles del 12 al 24 · Oro 18k o Plata 925"
            className={inputClass()}
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Texto informativo que se muestra a los clientes en la ficha pública del producto.
          </p>
        </div>

        {/* Gestor de Variantes Reales */}
        <div className="pt-2 border-t border-gray-100">
          {isEditing && initialData?.id ? (
            <VariantManager productId={initialData.id} basePrice={formData.price} />
          ) : (
            <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-xs font-bold text-[#1D1D1F]">
                  Gestión de talles y stock individual
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Guardá o publicá primero esta joya para poder cargar variantes individuales con su stock y SKU específico.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. SUGERENCIAS INTELIGENTES Y SEO ─────────────────────────── */}
      <section className="bg-white border border-gray-200/80 rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F] uppercase tracking-wide font-sans">
              4. Asistente y SEO (Opcional)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Generador automático y optimización para Google.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoSuggest}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>✨</span>
            <span>Autocompletar</span>
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel htmlFor="meta-title">Título SEO (Google)</FieldLabel>
              <span className="text-[11px] text-gray-400 font-mono">
                {formData.metaTitle.length}/70
              </span>
            </div>
            <input
              id="meta-title"
              type="text"
              maxLength={70}
              value={formData.metaTitle}
              onChange={set("metaTitle")}
              placeholder="Ej: Anillo Solitario Oro 18k | Joyería Petrucci"
              className={inputClass()}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel htmlFor="meta-desc">Descripción SEO (Google)</FieldLabel>
              <span className="text-[11px] text-gray-400 font-mono">
                {formData.metaDescription.length}/160
              </span>
            </div>
            <textarea
              id="meta-desc"
              rows={2}
              maxLength={160}
              value={formData.metaDescription}
              onChange={set("metaDescription")}
              placeholder="Ej: Anillo de compromiso en oro 18 kilates. Envío a todo el país o retiro en tienda..."
              className={`${inputClass()} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* ── Error Global ───────────────────────────────────────────────────── */}
      {submitError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-semibold text-red-800">
          {submitError}
        </div>
      )}

      {/* ── Botón de Publicar (Estilo Apple iOS) ─────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 px-6 ${getCtaBg()} active:scale-[0.98] text-base font-semibold uppercase tracking-wider rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer min-h-[56px]`}
        >
          {getCtaButton()}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="w-full py-3 text-center text-xs font-semibold text-gray-500 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
        >
          Cancelar y Volver
        </button>
      </div>
    </form>
  );
}
