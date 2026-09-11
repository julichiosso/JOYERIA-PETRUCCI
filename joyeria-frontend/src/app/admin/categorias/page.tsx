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
import CategoryMenuPreview from "@/components/admin/CategoryMenuPreview";
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
    <div className="flex flex-col gap-4 max-w-4xl mx-auto font-body text-gray-900 pb-16">
      {/* ── Encabezado Principal ─────────────────────────────────────────────── */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-950">
            Secciones y Rubros del Menú
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Organizá las secciones del menú principal y sus subcategorías de joyas o marcas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateRoot}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-lg shadow-sm transition-all active:scale-[0.98] shrink-0 min-h-[44px] cursor-pointer"
        >
          <span className="text-lg leading-none font-bold">+</span>
          <span>Nueva Sección Principal</span>
        </button>
      </div>

      {!loading && !error && <CategoryMenuPreview categories={categories} />}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-red-900 font-medium text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Cargando secciones...</p>
        </div>
      )}

      {/* ── Listado de Secciones ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-3.5">
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-base text-gray-700 mb-3">
                Todavía no tenés secciones creadas.
              </p>
              <button
                type="button"
                onClick={openCreateRoot}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold min-h-[44px]"
              >
                Crear la primera sección
              </button>
            </div>
          ) : (
            categories.map((cat, rootIndex) => (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden transition-all hover:border-gray-300"
              >
                {/* ── Cabecera de Categoría Principal ── */}
                <div className="p-3.5 md:p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "up", categories)}
                        disabled={rootIndex === 0}
                        title="Subir posición en el menú"
                        className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm text-gray-900 disabled:opacity-25 font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "down", categories)}
                        disabled={rootIndex === categories.length - 1}
                        title="Bajar posición en el menú"
                        className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm text-gray-900 disabled:opacity-25 font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          #{rootIndex + 1}
                        </span>
                        <h2 className="text-base md:text-lg font-bold text-gray-950">
                          {cat.name}
                        </h2>
                        {cat.isProtected && (
                          <span className="bg-amber-50 text-amber-900 text-[11px] font-medium px-2 py-0.5 rounded border border-amber-200">
                            Básica
                          </span>
                        )}
                        {!cat.isActive && (
                          <span className="bg-gray-200 text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                            Oculta
                          </span>
                        )}
                      </div>
                      {!cat.isActive && (
                        <span className="text-[11px] text-amber-800 font-normal block mt-0.5">
                          🔒 Los clientes no la ven en la tienda
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => openCreateSub(cat)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-950 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors min-h-[36px] cursor-pointer"
                    >
                      <span>+ Sub-rubro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[36px] cursor-pointer ${cat.isActive
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {cat.isActive ? "✓ Visible" : "○ Oculta"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="px-3 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors min-h-[36px] cursor-pointer"
                    >
                      Modificar
                    </button>

                    {cat.isProtected ? (
                      <span
                        className="px-2.5 py-2 text-[11px] text-gray-400 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed min-h-[36px] flex items-center"
                        title="Esta sección es fija y no puede borrarse"
                      >
                        Fija
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors min-h-[36px] cursor-pointer"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Subcategorías (Guardrail 4: empty-state amigable) ── */}
                <div className="p-3 md:p-4 bg-white">
                  {cat.children && cat.children.length > 0 ? (
                    <div className="flex flex-col gap-2 pl-3 border-l-2 border-amber-300">
                      {cat.children.map((sub, subIndex) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50/80 border border-gray-200 rounded-lg hover:bg-gray-100/70 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "up", cat.children)}
                                disabled={subIndex === 0}
                                className="w-8 h-8 flex items-center justify-center text-xs text-gray-800 hover:text-black bg-white border border-gray-300 rounded-md disabled:opacity-20 shadow-2xs font-bold active:scale-95 transition-all cursor-pointer"
                                title="Subir"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "down", cat.children)}
                                disabled={subIndex === cat.children.length - 1}
                                className="w-8 h-8 flex items-center justify-center text-xs text-gray-800 hover:text-black bg-white border border-gray-300 rounded-md disabled:opacity-20 shadow-2xs font-bold active:scale-95 transition-all cursor-pointer"
                                title="Bajar"
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-xs md:text-sm font-semibold text-gray-950">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(sub as unknown as Category, cat.name)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors cursor-pointer min-h-[32px]"
                            >
                              Modificar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(sub as unknown as Category)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-md transition-colors cursor-pointer min-h-[32px]"
                            >
                              Borrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Guardrail 4: Empty state amigable (no tabla vacía pelada) */
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 pl-3 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-500">
                        Esta sección no tiene sub-rubros todavía. Los productos se pueden asociar directo a <strong>{cat.name}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => openCreateSub(cat)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 py-2 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors min-h-[36px] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span className="text-sm font-bold">+</span>
                        Agregar la primera subcategoría
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ──────────────────────────────────────── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-950">
                {modal.mode === "create_root"
                  ? "Crear Sección Principal"
                  : modal.mode === "create_sub"
                    ? `Agregar adentro de ${modal.parentName}`
                    : `Modificar: ${originalName}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 text-2xl p-1 leading-none font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-5">
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={modal.mode === "create_sub" ? "Ej: Anillos, Cadenas, Seiko..." : "Ej: Joyería, Relojes, Mates..."}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base text-gray-950 focus:outline-none focus:border-gray-900"
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
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <p>
                      Ya existe una sección llamada <strong>«{duplicateWarning}»</strong>.
                      ¿Querés modificar la existente en vez de crear una nueva?
                    </p>
                  </div>
                )}
              </div>

              {/* Guardrail 3: Aviso de renombre SEO */}
              {showRenameWarning && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 text-base">🔗</span>
                  <p>
                    Si cambiás el nombre, la tienda va a <strong>redirigir automáticamente</strong> la URL anterior para no perder visitas de Google. No necesitás hacer nada extra.
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalle breve para explicar qué productos hay en esta sección..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-950 focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>

              {/* Visibilidad en modo edición */}
              {modal.mode === "edit" && (
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-5 h-5 text-gray-900 rounded border-gray-300"
                  />
                  <span className="text-base font-semibold text-gray-900">
                    Mostrar esta sección en la tienda para los clientes
                  </span>
                </label>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg text-base font-medium hover:bg-gray-100 min-h-[44px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-3 bg-gray-900 hover:bg-black text-white rounded-lg text-base font-bold shadow disabled:opacity-50 flex items-center gap-2 min-h-[44px] cursor-pointer"
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
