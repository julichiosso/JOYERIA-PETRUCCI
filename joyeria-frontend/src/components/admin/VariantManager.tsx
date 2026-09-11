"use client";

/**
 * components/admin/VariantManager.tsx
 * Gestión completa de variantes (talles, medidas, materiales) de un producto.
 * Permite agregar, editar inline, cambiar stock/disponibilidad, reordenar y eliminar.
 */

import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/auth";
import { useToast } from "@/hooks/useToast";

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: string | number | null;
  stock: number;
  isAvailable: boolean;
  order: number;
}

interface VariantManagerProps {
  productId: string;
  basePrice?: string | number;
}

function formatNumberDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function VariantManager({ productId, basePrice }: VariantManagerProps) {
  const toast = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form para nueva variante
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("1");
  const [newIsAvailable, setNewIsAvailable] = useState(true);
  const [savingNew, setSavingNew] = useState(false);

  // Estados de edición / guardado inline
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Cargar variantes del producto
  const loadVariants = useCallback(async () => {
    try {
      const res = await adminFetch<{ variants?: ProductVariant[] } | ProductVariant[]>(
        `/admin/products/${productId}`
      );
      if (Array.isArray(res)) {
        setVariants(res);
      } else if (res && Array.isArray(res.variants)) {
        setVariants(res.variants.sort((a, b) => a.order - b.order));
      }
    } catch {
      toast.error("No se pudieron cargar las variantes.");
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  // Agregar nueva variante
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error("El nombre de la variante es obligatorio (ej: Talle 16).");
      return;
    }

    setSavingNew(true);
    try {
      const cleanPriceDigits = newPrice.replace(/\D/g, "");
      const payload = {
        name: trimmedName,
        sku: newSku.trim() || undefined,
        price: cleanPriceDigits ? Number(cleanPriceDigits) : null,
        stock: Math.max(0, parseInt(newStock, 10) || 0),
        isAvailable: newIsAvailable,
        order: variants.length,
      };

      const created = await adminFetch<ProductVariant>(
        `/admin/products/${productId}/variants`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setVariants((prev) => [...prev, created]);
      setNewName("");
      setNewSku("");
      setNewPrice("");
      setNewStock("1");
      setNewIsAvailable(true);
      setIsAdding(false);
      toast.success(`Variante "${created.name}" agregada.`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message ?? "Error al crear la variante.");
    } finally {
      setSavingNew(false);
    }
  };

  // Actualizar campo individual de una variante (PATCH)
  const handleUpdateField = async (
    variantId: string,
    field: "name" | "sku" | "price" | "stock" | "isAvailable",
    value: unknown
  ) => {
    setUpdatingId(variantId);
    try {
      let patchBody: Record<string, unknown> = {};

      if (field === "price") {
        const rawDigits = String(value).replace(/\D/g, "");
        patchBody = { price: rawDigits ? Number(rawDigits) : null };
      } else if (field === "stock") {
        patchBody = { stock: Math.max(0, Number(value) || 0) };
      } else if (field === "name") {
        const trimmed = String(value).trim();
        if (!trimmed) {
          toast.error("El nombre no puede quedar vacío.");
          setUpdatingId(null);
          return;
        }
        patchBody = { name: trimmed };
      } else if (field === "sku") {
        const trimmed = String(value).trim();
        patchBody = { sku: trimmed || null };
      } else if (field === "isAvailable") {
        patchBody = { isAvailable: Boolean(value) };
      }

      const updated = await adminFetch<ProductVariant>(
        `/admin/products/variants/${variantId}`,
        {
          method: "PATCH",
          body: JSON.stringify(patchBody),
        }
      );

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, ...updated } : v))
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message ?? "Error al actualizar la variante.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Eliminar variante
  const handleDeleteVariant = async (variantId: string) => {
    setDeletingId(variantId);
    try {
      await adminFetch(`/admin/products/variants/${variantId}`, {
        method: "DELETE",
      });
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setConfirmDeleteId(null);
      toast.success("Variante eliminada.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message ?? "Error al eliminar la variante.");
    } finally {
      setDeletingId(null);
    }
  };

  // Mover orden de variantes
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= variants.length) return;

    const reordered = [...variants];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimista
    setVariants(reordered);

    try {
      await adminFetch(`/admin/products/${productId}/variants/reorder`, {
        method: "POST",
        body: JSON.stringify({ variantIds: reordered.map((v) => v.id) }),
      });
    } catch {
      toast.error("No se pudo guardar el nuevo orden.");
      loadVariants();
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
        <span className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        Cargando variantes...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1D1D1F]">
            Variantes de la pieza ({variants.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Talles, medidas o materiales con su propio stock o SKU opcional.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar variante
          </button>
        )}
      </div>

      {/* Formulario Inline para Nueva Variante */}
      {isAdding && (
        <form
          onSubmit={handleAddVariant}
          className="p-4 bg-gray-50 border border-blue-200 rounded-2xl flex flex-col gap-3 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
              Nueva variante
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Nombre (ej: Talle 16, Oro Blanco) *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Talle 17"
                autoFocus
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                SKU (Opcional)
              </label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="A-01"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Precio propio ($ ARS)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberDisplay(newPrice)}
                onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ""))}
                placeholder={basePrice ? `Base: $${formatNumberDisplay(basePrice)}` : "Usa precio base"}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Stock inicial
              </label>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newIsAvailable}
                onChange={(e) => setNewIsAvailable(e.target.checked)}
                className="w-4 h-4 text-[#007AFF] rounded border-gray-300 focus:ring-0"
              />
              <span className="text-xs font-semibold text-gray-700">Disponible para compra</span>
            </label>

            <button
              type="submit"
              disabled={savingNew}
              className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {savingNew ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar variante"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Variantes Existentes */}
      {variants.length === 0 && !isAdding ? (
        <div className="py-6 px-4 bg-[#F5F5F7]/60 border border-dashed border-gray-300 rounded-2xl text-center">
          <p className="text-xs font-semibold text-gray-500">
            Esta pieza no tiene variantes individuales configuradas.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Si se vende en varios talles o medidas, tocalos arriba para agregarlos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className={`p-3 bg-white border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                !variant.isAvailable || variant.stock === 0
                  ? "border-gray-200 bg-gray-50/50 opacity-80"
                  : "border-gray-200/90 shadow-2xs hover:border-gray-300"
              }`}
            >
              {/* Botones de orden y Nombre */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Flechas de orden */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-[#1D1D1F] disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                    title="Subir"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, "down")}
                    disabled={index === variants.length - 1}
                    className="p-1 text-gray-400 hover:text-[#1D1D1F] disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                    title="Bajar"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* Nombre editable inline */}
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    defaultValue={variant.name}
                    onBlur={(e) => {
                      if (e.target.value !== variant.name) {
                        handleUpdateField(variant.id, "name", e.target.value);
                      }
                    }}
                    placeholder="Nombre"
                    className="w-full text-xs font-bold text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#007AFF] focus:bg-[#F5F5F7] px-1.5 py-1 rounded-lg focus:outline-none transition-all"
                  />
                  <div className="flex items-center gap-2 mt-0.5 px-1.5">
                    <span className="text-[10px] text-gray-400 font-mono">
                      SKU: {variant.sku || "—"}
                    </span>
                    {variant.price && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ${formatNumberDisplay(variant.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controles de Stock, Disponibilidad y Eliminación */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {/* Stock */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">Stock:</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={variant.stock}
                    onBlur={(e) => {
                      const num = parseInt(e.target.value, 10);
                      if (!isNaN(num) && num !== variant.stock) {
                        handleUpdateField(variant.id, "stock", num);
                      }
                    }}
                    className="w-14 px-2 py-1 bg-[#F5F5F7] border border-gray-200 rounded-lg text-xs font-bold text-center text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#007AFF]"
                  />
                </div>

                {/* Toggle Disponibilidad */}
                <button
                  type="button"
                  onClick={() => handleUpdateField(variant.id, "isAvailable", !variant.isAvailable)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    variant.isAvailable && variant.stock > 0
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {variant.isAvailable && variant.stock > 0 ? "Disponible" : "Agotado"}
                </button>

                {/* Borrar con confirmación */}
                {confirmDeleteId === variant.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={deletingId === variant.id}
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {deletingId === variant.id ? "..." : "Borrar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-1 text-gray-500 hover:text-gray-800 text-[11px]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(variant.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                    title="Eliminar variante"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
