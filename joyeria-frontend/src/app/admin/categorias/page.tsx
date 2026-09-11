"use client";

/**
 * app/admin/categorias/page.tsx
 * Panel de Categorías y Subcategorías — Petrucci Joyería.
 *
 * Guardrails implementados:
 *  1. Bloqueo de borrado si hay joyas activas → modal informativo con link a esas joyas.
 *  2. Slug preview automático y visible bajo el campo nombre (minúsculas, sin tildes).
 *  3. Aviso inline al renombrar categoría existente (redirect SEO automático).
 *  4. Empty-state amigable con botón grande "+ Agregar primera subcategoría".
 *  5. Detección de nombre duplicado mientras el usuario escribe.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/auth";
import type { Category } from "@/types/category";
import { useToast } from "@/hooks/useToast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// ─── slug helper (client-side, sin dependencias extra) ─────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface ModalState {
  isOpen: boolean;
  mode: "create_root" | "create_sub" | "edit";
  parentId?: string;
  parentName?: string;
  category?: Category | { id: string; name: string; description?: string | null; sortOrder?: number; isActive?: boolean; slug?: string };
}

// Modal secundario para borrado bloqueado (categoría con joyas)
interface BlockedDeleteState {
  isOpen: boolean;
  categoryName: string;
  categoryId: string;
  productCount: number;
}

export default function AdminCategoriasPage() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Formulario (Crear/Editar)
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "create_root" });
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Nombre original (para detectar renombre en modo edit)
  const [originalName, setOriginalName] = useState("");

  // Modal de Eliminación (ConfirmModal estándar)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal bloqueante: categoría con joyas activas
  const [blockedDelete, setBlockedDelete] = useState<BlockedDeleteState>({
    isOpen: false,
    categoryName: "",
    categoryId: "",
    productCount: 0,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch<Category[] | { categories: Category[] }>("/admin/categories");
      const cats = Array.isArray(res) ? res : res?.categories || [];
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      cats.forEach((c) => c.children?.sort((a, b) => a.sortOrder - b.sortOrder));
      setCategories(cats);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 401) {
        router.push("/admin/login");
      } else {
        const msg = e.message ?? "No se pudieron cargar las categorías.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ── Nombres planos para detección de duplicados ─────────────────────────────
  const allNames = useMemo(() => {
    const names: string[] = [];
    categories.forEach((c) => {
      names.push(c.name.toLowerCase().trim());
      c.children?.forEach((sub) => names.push(sub.name.toLowerCase().trim()));
    });
    return names;
  }, [categories]);

  const duplicateWarning = useMemo(() => {
    const typed = formName.toLowerCase().trim();
    if (!typed) return null;
    const isEditing = modal.mode === "edit";
    const match = allNames.find((n) => n === typed);
    if (!match) return null;
    // En modo edición, no avisar si el nombre es el mismo que el original
    if (isEditing && typed === originalName.toLowerCase().trim()) return null;
    return formName.trim();
  }, [formName, allNames, modal.mode, originalName]);

  // Toggle Activo
  const toggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.isActive;
      await adminFetch(`/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      toast.success(`"${cat.name}" ahora está ${nextActive ? "visible en la tienda" : "oculta para los clientes"}.`);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo cambiar el estado de visibilidad.");
    }
  };

  // Mover orden
  const moveOrder = async (cat: Category, direction: "up" | "down", siblings: (Category | Category["children"][0])[]) => {
    const currentIndex = siblings.findIndex((s) => s.id === cat.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetCat = siblings[targetIndex];
    try {
      await Promise.all([
        adminFetch(`/admin/categories/${cat.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: targetCat.sortOrder }),
        }),
        adminFetch(`/admin/categories/${targetCat.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: cat.sortOrder }),
        }),
      ]);
      toast.info(`Orden actualizado para "${cat.name}".`);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo cambiar el orden de la sección.");
    }
  };

  // Abrir modales
  const openCreateRoot = () => {
    setFormName("");
    setFormDesc("");
    setFormOrder(categories.length);
    setFormActive(true);
    setOriginalName("");
    setModalError(null);
    setModal({ isOpen: true, mode: "create_root" });
  };

  const openCreateSub = (parent: Category) => {
    setFormName("");
    setFormDesc("");
    setFormOrder(parent.children?.length ?? 0);
    setFormActive(true);
    setOriginalName("");
    setModalError(null);
    setModal({
      isOpen: true,
      mode: "create_sub",
      parentId: parent.id,
      parentName: parent.name,
    });
  };

  const openEdit = (cat: Category, parentName?: string) => {
    setFormName(cat.name);
    setFormDesc(cat.description ?? "");
    setFormOrder(cat.sortOrder);
    setFormActive(cat.isActive);
    setOriginalName(cat.name);
    setModalError(null);
    setModal({
      isOpen: true,
      mode: "edit",
      parentName,
      category: cat,
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: "create_root" });
  };

  // Guardar desde modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError("Por favor escribí un nombre.");
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (modal.mode === "create_root") {
        await adminFetch("/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || undefined,
            sortOrder: Number(formOrder) || 0,
          }),
        });
        toast.success(`Se creó la sección "${formName.trim()}" con éxito.`);
      } else if (modal.mode === "create_sub") {
        await adminFetch("/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || undefined,
            parentId: modal.parentId,
            sortOrder: Number(formOrder) || 0,
          }),
        });
        toast.success(`Se agregó "${formName.trim()}" dentro de ${modal.parentName}.`);
      } else if (modal.mode === "edit" && modal.category) {
        await adminFetch(`/admin/categories/${modal.category.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || undefined,
            sortOrder: Number(formOrder) || 0,
            isActive: formActive,
          }),
        });
        toast.success(`Cambios guardados en "${formName.trim()}".`);
      }

      closeModal();
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message ?? "Ocurrió un error al guardar.";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar con manejo específico para "HAS_PRODUCTS"
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await adminFetch(`/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(`Se eliminó "${deleteTarget.name}".`);
      setDeleteTarget(null);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string; data?: { reason?: string; count?: number } };

      // Guardrail 1: categoría con joyas → modal bloqueante específico
      if (e.data?.reason === "HAS_PRODUCTS") {
        setDeleteTarget(null);
        setBlockedDelete({
          isOpen: true,
          categoryName: deleteTarget.name,
          categoryId: deleteTarget.id,
          productCount: e.data.count ?? 0,
        });
      } else {
        // Subcategorías u otro error
        const msg = e.message ?? "No se pudo eliminar la categoría.";
        toast.error(msg);
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // ── Slug preview (Guardrail 2) ──────────────────────────────────────────────
  const slugPreview = formName.trim() ? `/${slugify(formName.trim())}` : "";

  // ── Rename warning en modo edit (Guardrail 3) ───────────────────────────────
  const showRenameWarning =
    modal.mode === "edit" &&
    formName.trim() !== "" &&
    formName.trim() !== originalName &&
    Boolean(originalName);

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-[#1D1D1F] pb-16">
      {/* ── Encabezado Principal ─────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Categorías del Menú
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
            Organización de secciones principales y subrubros de la joyería.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateRoot}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-[0.98] shrink-0 min-h-[44px] cursor-pointer"
        >
          <span>+ Nueva Sección Principal</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 font-semibold text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Cargando secciones...</p>
        </div>
      )}

      {/* ── Listado de Secciones (Bento Box Estilo Apple — Cajas Japonesas) ────── */}
      {!loading && !error && (
        <div>
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200/80 rounded-3xl p-6 font-sans">
              <p className="text-base text-gray-600 mb-4 font-medium">
                No hay categorías creadas.
              </p>
              <button
                type="button"
                onClick={openCreateRoot}
                className="px-6 py-3 bg-[#1D1D1F] hover:bg-black text-white rounded-2xl text-sm font-semibold min-h-[44px] cursor-pointer"
              >
                + Crear primera sección
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-sans">
              {categories.map((cat, rootIndex) => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all gap-4"
                >
                  {/* Cabecera del Bento Box */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        {/* Botones para reordenar arriba/abajo */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveOrder(cat, "up", categories)}
                            disabled={rootIndex === 0}
                            title="Subir"
                            className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] border border-gray-200/80 hover:bg-gray-200 rounded-lg text-xs text-gray-700 disabled:opacity-20 font-bold transition-all cursor-pointer"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(cat, "down", categories)}
                            disabled={rootIndex === categories.length - 1}
                            title="Bajar"
                            className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] border border-gray-200/80 hover:bg-gray-200 rounded-lg text-xs text-gray-700 disabled:opacity-20 font-bold transition-all cursor-pointer"
                          >
                            ↓
                          </button>
                        </div>

                        <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight truncate">
                          {cat.name}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleActive(cat)}
                        className="px-2.5 py-1 bg-[#F5F5F7] border border-gray-200/80 text-gray-700 hover:bg-gray-200 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {cat.isActive ? "Visible" : "Oculta"}
                      </button>
                    </div>

                    {/* Lista compacta de Subrubros */}
                    <div className="flex flex-col gap-1.5 min-h-[80px]">
                      {cat.children && cat.children.length > 0 ? (
                        cat.children.map((sub, subIndex) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between px-3 py-2 bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] rounded-xl transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveOrder(sub as unknown as Category, "up", cat.children)}
                                  disabled={subIndex === 0}
                                  className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 hover:text-black bg-white rounded border border-gray-200 disabled:opacity-20 font-bold cursor-pointer"
                                  title="Subir"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveOrder(sub as unknown as Category, "down", cat.children)}
                                  disabled={subIndex === cat.children.length - 1}
                                  className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 hover:text-black bg-white rounded border border-gray-200 disabled:opacity-20 font-bold cursor-pointer"
                                  title="Bajar"
                                >
                                  ↓
                                </button>
                              </div>
                              <span className="text-xs font-semibold text-[#1D1D1F] truncate">
                                {sub.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEdit(sub as unknown as Category, cat.name)}
                                className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(sub as unknown as Category)}
                                className="px-1.5 py-1 text-[11px] font-medium text-gray-400 hover:text-black transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 font-medium py-3 text-center">
                          Sin subrubros aún.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones de pie del Bento Box */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openCreateSub(cat)}
                      className="px-3.5 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span> Subrubro
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="px-3 py-1.5 bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-100 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        Editar
                      </button>

                      {!cat.isProtected && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="px-2.5 py-1.5 text-gray-400 hover:text-[#1D1D1F] text-xs font-medium transition-colors cursor-pointer"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ──────────────────────────────────────── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-[#1D1D1F]">
                {modal.mode === "create_root"
                  ? "Crear Sección Principal"
                  : modal.mode === "create_sub"
                    ? `Agregar adentro de ${modal.parentName}`
                    : `Editar: ${originalName}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-black text-xl p-1 leading-none font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-5">
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm font-semibold">
                  {modalError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-sans">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={modal.mode === "create_sub" ? "Ej: Anillos, Cadenas, Seiko..." : "Ej: Joyería, Relojes, Mates..."}
                  className="w-full px-4 py-3.5 bg-[#F5F5F7] border border-gray-200/80 rounded-2xl text-base font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans"
                  required
                  autoFocus
                />

                {/* Guardrail 2: Slug preview */}
                {slugPreview && (
                  <p className="text-[11px] text-gray-400 mt-1.5 font-mono">
                    URL en tienda: <span className="text-gray-600">petrucci.com{slugPreview}</span>
                  </p>
                )}

                {/* Guardrail 5: Advertencia de duplicado */}
                {duplicateWarning && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 flex items-start gap-2">
                    <p>
                      Ya existe una sección llamada <strong>«{duplicateWarning}»</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Guardrail 3: Aviso de renombre SEO */}
              {showRenameWarning && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900">
                  <p>
                    Si cambiás el nombre, la tienda va a redirigir automáticamente la URL anterior.
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-sans">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalle breve para explicar qué productos hay en esta sección..."
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-200/80 rounded-2xl text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans resize-none"
                />
              </div>

              {/* Visibilidad en modo edición */}
              {modal.mode === "edit" && (
                <label className="flex items-center gap-3 p-4 bg-[#F5F5F7] rounded-2xl cursor-pointer border border-gray-200/80">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-5 h-5 text-black rounded-lg border-gray-300 focus:ring-0"
                  />
                  <span className="text-sm font-semibold text-[#1D1D1F]">
                    Mostrar esta sección en la tienda para los clientes
                  </span>
                </label>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-3 border border-gray-200 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-100 min-h-[44px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#1D1D1F] hover:bg-black text-white rounded-2xl text-sm font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL ESTÁNDAR DE CONFIRMACIÓN DE ELIMINACIÓN ────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`¿Eliminar "${deleteTarget?.name}"?`}
        message="¿Estás seguro de que querés borrar esta categoría? Si contiene joyas o subcategorías, el sistema evitará la eliminación."
        confirmLabel="Sí, borrar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── GUARDRAIL 1: MODAL BLOQUEANTE — CATEGORÍA CON JOYAS ─────────────── */}
      {blockedDelete.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setBlockedDelete((s) => ({ ...s, isOpen: false }))}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-10 font-body">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full shrink-0 bg-amber-100 text-amber-700">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4l9 16H3L12 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12 10v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex-1 pt-0.5">
                <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                  No podés eliminar «{blockedDelete.categoryName}»
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Esta sección tiene <strong>{blockedDelete.productCount} joya{blockedDelete.productCount !== 1 ? "s" : ""} cargada{blockedDelete.productCount !== 1 ? "s" : ""}</strong>.
                  Primero movélas a otra categoría, o contactá a soporte si necesitás ayuda.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockedDelete((s) => ({ ...s, isOpen: false }))}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Entendido
              </button>
              <Link
                href={`/admin/productos?category=${blockedDelete.categoryId}`}
                onClick={() => setBlockedDelete((s) => ({ ...s, isOpen: false }))}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Ver esas joyas →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
