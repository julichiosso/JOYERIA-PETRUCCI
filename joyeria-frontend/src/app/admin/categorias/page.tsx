"use client";

/**
 * app/admin/categorias/page.tsx
 * Panel de Categorías y Subcategorías diseñado especialmente para uso fácil, claro y directo.
 *
 * Características para personas mayores / facilidad de uso:
 *  - Textos grandes, claros y en español simple (sin jerga técnica).
 *  - Botones de gran tamaño y buen contraste para pulsar fácil.
 *  - Distinción visual obvia entre Categoría Principal y Subcategorías internas.
 *  - Confirmaciones y mensajes de ayuda paso a paso.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";
import type { Category } from "@/types/category";

interface ModalState {
  isOpen: boolean;
  mode: "create_root" | "create_sub" | "edit";
  parentId?: string;
  parentName?: string;
  category?: Category | { id: string; name: string; description?: string | null; sortOrder?: number; isActive?: boolean };
}

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "create_root" });
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Eliminación
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setError(e.message ?? "No se pudieron cargar las categorías.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Toggle Activo
  const toggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.isActive;
      await adminFetch(`/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      showSuccess(`"${cat.name}" ahora está ${nextActive ? "visible en la tienda" : "oculta"}.`);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo cambiar el estado.");
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
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo mover la posición.");
    }
  };

  // Abrir modales
  const openCreateRoot = () => {
    setFormName("");
    setFormDesc("");
    setFormOrder(categories.length);
    setFormActive(true);
    setModalError(null);
    setModal({ isOpen: true, mode: "create_root" });
  };

  const openCreateSub = (parent: Category) => {
    setFormName("");
    setFormDesc("");
    setFormOrder(parent.children?.length ?? 0);
    setFormActive(true);
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

  // Guardar
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
        showSuccess(`Se creó la sección "${formName.trim()}" con éxito.`);
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
        showSuccess(`Se agregó "${formName.trim()}" dentro de ${modal.parentName}.`);
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
        showSuccess(`Cambios guardados en "${formName.trim()}".`);
      }

      closeModal();
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setModalError(e.message ?? "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await adminFetch(`/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showSuccess(`Se eliminó "${deleteTarget.name}".`);
      setDeleteTarget(null);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeleteError(e.message ?? "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-body text-gray-900 pb-12">
      {/* ── Encabezado Principal y Explicación ──────────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Secciones y Rubros del Menú
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
            Acá podés ordenar los rubros de tu joyería. Las <strong>secciones principales</strong> son los botones del menú de arriba, y las <strong>subcategorías</strong> son los tipos de joyas o marcas que van adentro.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateRoot}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white font-medium text-base rounded-lg shadow-sm transition-all active:scale-[0.98] shrink-0"
        >
          <span className="text-xl leading-none font-bold">+</span>
          <span>Nueva Sección Principal</span>
        </button>
      </div>

      {/* Mensaje de éxito verde */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-900 font-medium text-base flex items-center gap-3 shadow-xs">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-700 shrink-0">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mensaje de error general */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 font-medium text-base">
          {error}
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-base text-gray-600 font-medium">Cargando secciones...</p>
        </div>
      )}

      {/* ── Listado de Secciones ───────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-lg text-gray-700 mb-4">
                Todavía no tenés secciones creadas.
              </p>
              <button
                type="button"
                onClick={openCreateRoot}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg text-base font-semibold"
              >
                Crear la primera sección
              </button>
            </div>
          ) : (
            categories.map((cat, rootIndex) => (
              <div
                key={cat.id}
                className="bg-white border-2 border-gray-200 rounded-xl shadow-xs overflow-hidden"
              >
                {/* ── Cabecera de Categoría Principal ── */}
                <div className="p-5 md:p-6 bg-gray-50/80 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Botones de orden sencillos */}
                    <div className="flex flex-col gap-1 shrink-0 mt-0.5">
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "up", categories)}
                        disabled={rootIndex === 0}
                        title="Subir posición en el menú"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded text-gray-800 disabled:opacity-20 font-bold"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "down", categories)}
                        disabled={rootIndex === categories.length - 1}
                        title="Bajar posición en el menú"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 rounded text-gray-800 disabled:opacity-20 font-bold"
                      >
                        ▼
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded">
                          Lugar {rootIndex + 1}
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-950">
                          {cat.name}
                        </h2>
                        {cat.isProtected && (
                          <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300">
                            Sección básica del negocio
                          </span>
                        )}
                        {!cat.isActive && (
                          <span className="bg-gray-300 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                            Oculta de los clientes
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones principales */}
                  <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
                    {/* Botón Visible / Oculto */}
                    <button
                      type="button"
                      onClick={() => toggleActive(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        cat.isActive
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100"
                          : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.isActive ? "✓ Visible en tienda" : "○ Ocultar"}
                    </button>

                    {/* Botón Modificar */}
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Modificar
                    </button>

                    {/* Botón Eliminar */}
                    {cat.isProtected ? (
                      <span
                        className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed"
                        title="Esta sección es fija y no puede borrarse"
                      >
                        Protegida
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(cat);
                        }}
                        className="px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Subcategorías / Tipos de Joyas / Marcas adentro ── */}
                <div className="p-5 md:p-6 bg-white flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Tipos de productos o marcas adentro de &quot;{cat.name}&quot; ({cat.children?.length ?? 0}):
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateSub(cat)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-950 py-2 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <span className="font-bold text-base">+</span>
                      <span>Agregar sub-rubro a {cat.name}</span>
                    </button>
                  </div>

                  {cat.children && cat.children.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cat.children.map((sub, subIndex) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100/70 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Orden sub */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "up", cat.children)}
                                disabled={subIndex === 0}
                                className="w-5 h-5 flex items-center justify-center text-xs text-gray-600 hover:text-black bg-white border border-gray-200 rounded disabled:opacity-20"
                                title="Subir"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "down", cat.children)}
                                disabled={subIndex === cat.children.length - 1}
                                className="w-5 h-5 flex items-center justify-center text-xs text-gray-600 hover:text-black bg-white border border-gray-200 rounded disabled:opacity-20"
                                title="Bajar"
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-base font-semibold text-gray-900">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(sub as unknown as Category, cat.name)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              Modificar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(sub as unknown as Category);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-md transition-colors"
                            >
                              Borrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 text-center">
                      No tiene subcategorías (los productos se cargan directo en {cat.name}).
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ────────────────────────────────────── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-950">
                {modal.mode === "create_root"
                  ? "Crear Sección Principal"
                  : modal.mode === "create_sub"
                  ? `Agregar adentro de ${modal.parentName}`
                  : `Modificar: ${formName}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 text-2xl p-1 leading-none font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-5">
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium">
                  {modalError}
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
              </div>

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
                  className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg text-base font-medium hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-3 bg-gray-900 hover:bg-black text-white rounded-lg text-base font-bold shadow disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-950">
              ¿Eliminar &quot;{deleteTarget.name}&quot;?
            </h2>

            {deleteError ? (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 text-sm leading-relaxed">
                <strong>No se pudo borrar:</strong>
                <p className="mt-1 font-medium">{deleteError}</p>
                <p className="mt-2 text-xs text-gray-600">
                  Si esta categoría contiene productos o subcategorías, primero debés cambiar de categoría esos productos o borrarlos.
                </p>
              </div>
            ) : (
              <p className="text-base text-gray-700 leading-relaxed">
                ¿Estás seguro de que querés borrar esta categoría? Si tiene productos asociados, el sistema no la borrará para no perder tus datos.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 border border-gray-300 text-gray-800 rounded-lg text-base font-medium hover:bg-gray-100"
              >
                {deleteError ? "Entendido, cerrar" : "Cancelar"}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-bold shadow disabled:opacity-50"
                >
                  {deleting ? "Borrando..." : "Sí, borrar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
