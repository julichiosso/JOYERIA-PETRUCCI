"use client";

/**
 * components/admin/ProductForm.tsx
 * Formulario reutilizable para crear y editar productos.
 *
 * Usado por:
 *  - /admin/productos/nuevo (sin initialData)
 *  - /admin/productos/[id] (con initialData)
 *
 * Campos:
 *  - Nombre, descripción, categoría (select), estado
 *  - Precio + toggle "Mostrar precio"
 *  - Etiqueta de variantes (texto libre — no selector, alineado con el backend)
 *  - Subida de imágenes con ImageUploader
 *  - Meta title y meta description (colapsable "SEO avanzado")
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";
import type { AdminApiError } from "@/lib/auth";
import ImageUploader, { type UploadedImage } from "./ImageUploader";
import type { Category } from "@/types/category";

type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  status: ProductStatus;
  price: string;
  showPrice: boolean;
  variantLabel: string;
  metaTitle: string;
  metaDescription: string;
}

interface InitialProductData extends ProductFormData {
  id: string;
  images: UploadedImage[];
}

interface ProductFormProps {
  initialData?: InitialProductData;
}

const STATUS_OPTIONS: { value: ProductStatus; label: string; color: string }[] = [
  { value: "ACTIVE", label: "Activo — visible en la tienda", color: "text-green-700" },
  { value: "DRAFT", label: "Borrador — oculto en la tienda", color: "text-yellow-700" },
  { value: "OUT_OF_STOCK", label: "Sin stock — visible pero agotado", color: "text-red-700" },
];

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-body text-xs tracking-wide text-gray-700 font-medium mb-1.5">
      {children}
    </label>
  );
}

function inputClass(error?: boolean) {
  return `w-full px-3.5 py-2.5 border ${error ? "border-red-400" : "border-gray-300"} rounded-md font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors`;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    categoryId: initialData?.categoryId ?? "",
    status: initialData?.status ?? "DRAFT",
    price: initialData?.price ?? "",
    showPrice: initialData?.showPrice ?? false,
    variantLabel: initialData?.variantLabel ?? "",
    metaTitle: initialData?.metaTitle ?? "",
    metaDescription: initialData?.metaDescription ?? "",
  });

  const [images, setImages] = useState<UploadedImage[]>(initialData?.images ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  // Cargar categorías al montar
  useEffect(() => {
    adminFetch<{ categories: Category[] }>("/admin/categories")
      .then(({ categories: cats }) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  const set = (key: keyof ProductFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.categoryId) errors.categoryId = "Seleccioná una categoría";
    if (formData.price && isNaN(Number(formData.price))) {
      errors.price = "El precio debe ser un número";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Verificar que no haya imágenes todavía subiendo
    const stillUploading = images.some((img) => img._uploading);
    if (stillUploading) {
      setSubmitError("Esperá a que terminen de subir todas las fotos.");
      return;
    }

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
        // Las imágenes ya están subidas — enviamos los IDs/URLs para asociarlas
        // TODO: el backend necesita un endpoint para asociar imágenes al producto
        // por ahora las imágenes se suben a /admin/media de forma independiente
      };

      if (isEditing) {
        await adminFetch(`/admin/products/${initialData!.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      const error = err as AdminApiError;
      if (error.status === 401) {
        router.push("/admin/login");
      } else {
        setSubmitError(error.message ?? "Ocurrió un error. Intentá de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

      {/* ── Información básica ────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900 tracking-wide">
          Información del producto
        </h2>

        {/* Nombre */}
        <div>
          <FieldLabel htmlFor="prod-name">
            Nombre <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            id="prod-name"
            type="text"
            value={formData.name}
            onChange={set("name")}
            placeholder="Ej: Anillo solitario oro blanco 18k"
            className={inputClass(Boolean(fieldErrors.name))}
            required
          />
          {fieldErrors.name && (
            <p className="mt-1 font-body text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <FieldLabel htmlFor="prod-desc">Descripción</FieldLabel>
          <textarea
            id="prod-desc"
            value={formData.description}
            onChange={set("description")}
            rows={4}
            placeholder="Describí el producto: material, medidas, características especiales…"
            className={`${inputClass()} resize-none`}
          />
        </div>

        {/* Categoría */}
        <div>
          <FieldLabel htmlFor="prod-category">
            Categoría <span className="text-red-500">*</span>
          </FieldLabel>
          <select
            id="prod-category"
            value={formData.categoryId}
            onChange={set("categoryId")}
            className={inputClass(Boolean(fieldErrors.categoryId))}
            required
          >
            <option value="">— Seleccioná una categoría —</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children.length > 0 ? (
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
            <p className="mt-1 font-body text-xs text-red-600">{fieldErrors.categoryId}</p>
          )}
        </div>

        {/* Estado */}
        <div>
          <FieldLabel htmlFor="prod-status">Estado</FieldLabel>
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
          <p className="mt-1 font-body text-xs text-gray-500">
            {formData.status === "DRAFT" && "⚠️ El producto no aparece en la tienda hasta que lo actives."}
            {formData.status === "ACTIVE" && "✓ El producto es visible en la tienda."}
            {formData.status === "OUT_OF_STOCK" && "📦 Visible en la tienda pero marcado como agotado."}
          </p>
        </div>
      </section>

      {/* ── Precio ────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-5">
        <h2 className="font-body text-sm font-semibold text-gray-900 tracking-wide">
          Precio
        </h2>

        <div>
          <FieldLabel htmlFor="prod-price">Precio (ARS)</FieldLabel>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-body text-sm text-gray-500">$</span>
            <input
              id="prod-price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={set("price")}
              placeholder="0.00"
              className={`${inputClass(Boolean(fieldErrors.price))} pl-7`}
            />
          </div>
          {fieldErrors.price && (
            <p className="mt-1 font-body text-xs text-red-600">{fieldErrors.price}</p>
          )}
        </div>

        {/* Toggle mostrar precio */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={formData.showPrice}
              onChange={(e) => setFormData((p) => ({ ...p, showPrice: e.target.checked }))}
              className="sr-only peer"
              id="show-price-toggle"
            />
            <div className="w-10 h-6 bg-gray-300 peer-checked:bg-amber-600 rounded-full transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
          <div>
            <p className="font-body text-sm text-gray-900 font-medium">
              Mostrar precio en la tienda
            </p>
            <p className="font-body text-xs text-gray-500 mt-0.5 leading-snug">
              Si está desactivado, el cliente verá "Consultar precio" y solo podrá contactarte por WhatsApp.
            </p>
          </div>
        </label>

        {/* Variantes */}
        <div>
          <FieldLabel htmlFor="prod-variant">Etiqueta de variantes (opcional)</FieldLabel>
          <input
            id="prod-variant"
            type="text"
            value={formData.variantLabel}
            onChange={set("variantLabel")}
            placeholder='Ej: "Disponible en oro blanco, oro amarillo y champagne"'
            className={inputClass()}
          />
          <p className="mt-1 font-body text-xs text-gray-500">
            Texto descriptivo de las variantes. Se muestra en la ficha del producto.
          </p>
        </div>
      </section>

      {/* ── Fotos ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col gap-4">
        <h2 className="font-body text-sm font-semibold text-gray-900 tracking-wide">
          Fotos del producto
        </h2>
        <p className="font-body text-xs text-gray-500 -mt-1">
          La primera foto es la imagen principal. Podés subir varias.
        </p>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          disabled={submitting}
        />
      </section>

      {/* ── SEO (colapsable) ──────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setSeoOpen(!seoOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          aria-expanded={seoOpen}
        >
          <div>
            <p className="font-body text-sm font-semibold text-gray-900 tracking-wide">
              SEO avanzado
            </p>
            <p className="font-body text-xs text-gray-500 mt-0.5">
              Opcional — el sistema genera estos datos automáticamente si los dejás vacíos
            </p>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={`text-gray-400 transition-transform duration-200 ${seoOpen ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {seoOpen && (
          <div className="border-t border-gray-200 p-5 md:p-6 flex flex-col gap-4">
            <div>
              <FieldLabel htmlFor="meta-title">Título SEO</FieldLabel>
              <input
                id="meta-title"
                type="text"
                value={formData.metaTitle}
                onChange={set("metaTitle")}
                placeholder="Ej: Anillo Solitario Oro Blanco 18k | Petrucci Joyería"
                maxLength={70}
                className={inputClass()}
              />
              <p className="mt-1 font-body text-xs text-gray-400">
                {formData.metaTitle.length}/70 caracteres
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="meta-desc">Descripción SEO</FieldLabel>
              <textarea
                id="meta-desc"
                value={formData.metaDescription}
                onChange={set("metaDescription")}
                rows={3}
                placeholder="Descripción breve para buscadores…"
                maxLength={160}
                className={`${inputClass()} resize-none`}
              />
              <p className="mt-1 font-body text-xs text-gray-400">
                {formData.metaDescription.length}/160 caracteres
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Error global + Submit ─────────────────────────────────────────── */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 mt-0.5 text-red-500">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="font-body text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row gap-3 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="flex-1 md:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-body text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 md:flex-none px-8 py-3 bg-gray-900 text-white font-body text-sm rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Guardando…
            </>
          ) : isEditing ? (
            "Guardar cambios"
          ) : (
            "Crear producto"
          )}
        </button>
      </div>
    </form>
  );
}
