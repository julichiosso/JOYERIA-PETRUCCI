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
  { value: "ACTIVE", label: "Activo", desc: "Visible inmediatamente en la tienda pública" },
  { value: "DRAFT", label: "Borrador", desc: "Oculto, visible solo para el administrador" },
  { value: "OUT_OF_STOCK", label: "Sin stock", desc: "Visible en la tienda pero con badge de agotado" },
];

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function inputClass(error?: boolean) {
  return `w-full px-3.5 py-2.5 bg-gray-50 border ${error ? "border-red-400 bg-red-50/20" : "border-gray-300"} rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors`;
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-4xl mx-auto font-body text-gray-900 pb-16">

      {/* ── Indicador de Pasos Visuales (Progress Steps) ───────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs py-1 scrollbar-hide">
          {[
            { step: 1, title: "1. Datos Básicos", isDone: Boolean(formData.name.trim() && formData.categoryId) },
            { step: 2, title: "2. Precio & Variantes", isDone: Boolean(formData.price || formData.variantLabel) },
            { step: 3, title: "3. Fotos", isDone: images.length > 0 },
            { step: 4, title: "4. Posicionamiento SEO", isDone: Boolean(formData.metaTitle || formData.metaDescription) },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2 shrink-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${s.isDone ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                {s.isDone ? "✓" : s.step}
              </span>
              <span className={`font-medium whitespace-nowrap ${s.isDone ? "text-gray-900" : "text-gray-500"}`}>
                {s.title}
              </span>
              {s.step < 4 && <span className="text-gray-300 hidden sm:inline ml-1">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Encabezado de la página ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-body text-2xl sm:text-3xl text-gray-950 font-bold tracking-tight">
            {isEditing ? "Editar Joya / Pieza" : "Cargar Nueva Joya o Pieza"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Completá los datos del producto. Podés usar las sugerencias automáticas para agilizar la carga.
          </p>
        </div>

        {/* Botón de Asistente Automático — deshabilitado hasta que haya nombre */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleAutoSuggest}
            disabled={!formData.name.trim()}
            title={!formData.name.trim() ? "Escribí el nombre del producto primero, después tocá acá" : "Completar categoría, descripción y SEO automáticamente"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span>✨ Autocompletar sugerencias y SEO</span>
          </button>
          {!formData.name.trim() && (
            <p className="text-[11px] text-gray-500 mt-1 text-center">
              Escribí el nombre primero
            </p>
          )}
        </div>
      </div>

      {appliedSuggestion && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <span>✓ Sugerencias de descripción, variantes y SEO aplicadas con éxito. Podés editarlas libremente.</span>
        </div>
      )}

      {/* ── 1. Información Principal ───────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
          1. Información de la Pieza
        </h2>

        {/* Nombre */}
        <div>
          <FieldLabel htmlFor="prod-name" required>
            Nombre del Producto
          </FieldLabel>
          <input
            id="prod-name"
            type="text"
            value={formData.name}
            onChange={set("name")}
            placeholder="Ej: Anillo Solitario Oro Blanco 18k con Circonia Cúbica"
            className={inputClass(Boolean(fieldErrors.name))}
            required
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Categoría y Estado en 2 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categoría */}
          <div>
            <FieldLabel htmlFor="prod-category" required>
              Categoría / Departamento
            </FieldLabel>
            <select
              id="prod-category"
              value={formData.categoryId}
              onChange={set("categoryId")}
              className={inputClass(Boolean(fieldErrors.categoryId))}
              required
            >
              <option value="">— Seleccioná la categoría —</option>
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
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.categoryId}</p>
            )}
          </div>

          {/* Estado de Publicación */}
          <div>
            <FieldLabel htmlFor="prod-status">
              Estado en Tienda
            </FieldLabel>
            <select
              id="prod-status"
              value={formData.status}
              onChange={set("status")}
              className={inputClass()}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.desc})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <FieldLabel htmlFor="prod-desc">
            Descripción Detallada
          </FieldLabel>
          <textarea
            id="prod-desc"
            value={formData.description}
            onChange={set("description")}
            rows={4}
            placeholder="Detalles de la joya: pureza del metal (18k / 925), medidas, gemas, tipo de cierre, garantía de orfebrería..."
            className={`${inputClass()} resize-y`}
          />
        </div>
      </section>

      {/* ── 2. Precios y Variantes ─────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
          2. Precio y Variantes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Precio en ARS formateado en vivo sin salto de cursor */}
          <div>
            <FieldLabel htmlFor="prod-price">Precio en Pesos (ARS)</FieldLabel>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$</span>
              <input
                id="prod-price"
                type="text"
                inputMode="numeric"
                value={formatPriceDisplay(formData.price)}
                onChange={handlePriceChange}
                placeholder="1.850.000"
                className={`${inputClass(Boolean(fieldErrors.price))} pl-8 font-semibold tracking-wide`}
              />
            </div>
            {fieldErrors.price && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.price}</p>
            )}
          </div>

          {/* Toggle Mostrar Precio */}
          <div className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={formData.showPrice}
                  onChange={(e) => setFormData((p) => ({ ...p, showPrice: e.target.checked }))}
                  className="sr-only peer"
                  id="show-price-toggle"
                />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-amber-700 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  Mostrar precio públicamente
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Si se desactiva, los clientes verán &quot;Consultar precio por WhatsApp&quot;.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Variantes disponibles */}
        <div>
          <FieldLabel htmlFor="prod-variant">Variantes / Talles / Medidas (Opcional)</FieldLabel>
          <input
            id="prod-variant"
            type="text"
            value={formData.variantLabel}
            onChange={set("variantLabel")}
            placeholder='Ej: "Disponible en oro amarillo, blanco y rosé · Talles 14 al 22"'
            className={inputClass()}
          />
        </div>
      </section>

      {/* ── 3. Fotos del Producto ──────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
          3. Fotos de la Pieza (Cámara o Galería)
        </h2>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          disabled={submitting}
        />

        {/* Nota aclaratoria sobre texto alternativo (Alt) */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2.5 mt-1">
          <span className="text-sm shrink-0">ℹ️</span>
          <p>
            <strong>Texto alternativo (Alt):</strong> Ayuda a posicionar tus fotos en las búsquedas de Google. Si lo dejás vacío, la tienda usará automáticamente el nombre de la joya como descripción.
          </p>
        </div>
      </section>

      {/* ── 4. Posicionamiento SEO para Google (Colapsable) ────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setSeoOpen(!seoOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/80 transition-colors cursor-pointer"
          aria-expanded={seoOpen}
        >
          <div>
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              4. Posicionamiento SEO en Google (Opcional)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Mejora cómo aparece esta joya en las búsquedas de Google y redes sociales.
            </p>
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-400 transition-transform ${seoOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {seoOpen && (
          <div className="border-t border-gray-200 p-5 sm:p-6 flex flex-col gap-4 bg-gray-50/50">
            <div>
              <FieldLabel htmlFor="meta-title">Título que aparece en Google</FieldLabel>
              <input
                id="meta-title"
                type="text"
                value={formData.metaTitle}
                onChange={set("metaTitle")}
                placeholder="Ej: Anillo Solitario Oro Blanco 18k | Joyería Petrucci"
                maxLength={70}
                className={inputClass()}
              />
              <p className="text-[11px] text-gray-500 mt-1">{formData.metaTitle.length} / 70 caracteres recomendados</p>
            </div>

            <div>
              <FieldLabel htmlFor="meta-desc">Resumen que aparece en Google</FieldLabel>
              <textarea
                id="meta-desc"
                value={formData.metaDescription}
                onChange={set("metaDescription")}
                rows={3}
                placeholder="Descripción concisa que aparecerá en los resultados de Google..."
                maxLength={160}
                className={`${inputClass()} resize-none`}
              />
              <p className="text-[11px] text-gray-500 mt-1">{formData.metaDescription.length} / 160 caracteres recomendados</p>
            </div>

            {/* Preview visual de búsqueda en Google */}
            {(formData.metaTitle || formData.metaDescription) && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Así se verá en Google:</p>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-amber-800 flex items-center justify-center text-white text-[9px] font-bold shrink-0">P</div>
                    <div>
                      <p className="text-[11px] text-gray-700 leading-none">Petrucci Joyería</p>
                      <p className="text-[11px] text-green-700 leading-none mt-0.5 font-mono">
                        petrucci.com.ar › {formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30) : 'producto'}
                      </p>
                    </div>
                  </div>
                  <p className="text-blue-700 font-medium text-sm leading-tight hover:underline cursor-pointer">
                    {formData.metaTitle || formData.name || '(sin título)'}
                  </p>
                  {formData.metaDescription && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                      {formData.metaDescription}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Error Global ───────────────────────────────────────────────────── */}
      {submitError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {submitError}
        </div>
      )}

      {/* ── Botones de Guardar Adaptativos ─────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full sm:w-auto px-8 py-3 text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${getCtaBg()}`}
        >
          {getCtaButton()}
        </button>
      </div>
    </form>
  );
}
