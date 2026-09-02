"use client";

/**
 * app/admin/categorias/page.tsx
 * Editor completo de Categorías y Subcategorías para el panel de administración.
 *
 * Características:
 *  - Crear categorías raíz y subcategorías (ej. Marcas en Relojes o Secciones en Joyería)
 *  - Editar nombre, descripción, visibilidad y orden en el menú
 *  - Reorganizar orden con flechas simples (↑ / ↓)
 *  - Eliminar categorías con confirmación y manejo de protecciones del backend
 *  - Mobile-first con botones grandes y explicaciones claras sin jerga técnica
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

  // Estado del modal de creación / edición
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "create_root" });
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado de eliminación
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch<Category[] | { categories: Category[] }>("/admin/categories");
      const cats = Array.isArray(res) ? res : res?.categories || [];
      // Ordenar por sortOrder
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

  // ── Toggle Activo / Inactivo ──────────────────────────────────────────────
  const toggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.isActive;
      await adminFetch(`/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      showSuccess(`Categoría "${cat.name}" ${nextActive ? "activada" : "ocultada"}.`);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo cambiar el estado de la categoría.");
    }
  };

  // ── Reordenar ↑ / ↓ ───────────────────────────────────────────────────────
  const moveOrder = async (cat: Category, direction: "up" | "down", siblings: (Category | Category["children"][0])[]) => {
    const currentIndex = siblings.findIndex((s) => s.id === cat.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetCat = siblings[targetIndex];
    try {
      // Intercambiar sortOrder
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
      alert(e.message ?? "No se pudo mover el orden.");
    }
  };

  // ── Abrir Modales ─────────────────────────────────────────────────────────
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

  // ── Guardar Creación / Edición ───────────────────────────────────────────
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError("Por favor ingresá un nombre para la categoría.");
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
        showSuccess(`Categoría "${formName.trim()}" creada con éxito.`);
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
        showSuccess(`Subcategoría "${formName.trim()}" agregada a ${modal.parentName}.`);
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

  // ── Eliminar Categoría ───────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await adminFetch(`/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showSuccess(`Categoría "${deleteTarget.name}" eliminada.`);
      setDeleteTarget(null);
      loadCategories();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeleteError(e.message ?? "No se pudo eliminar la categoría.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="font-body text-xl md:text-2xl font-bold text-gray-900">
            Categorías y Secciones
          </h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            Organizá los rubros y marcas que tus clientes ven en el menú de la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateRoot}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white font-body text-sm font-semibold rounded-lg shadow transition-all active:scale-[0.98] shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Nueva categoría principal</span>
        </button>
      </div>

      {/* Alerta de éxito */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-body text-sm flex items-center gap-2 shadow-sm animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 text-emerald-600">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alerta de error general */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {/* Spinner de carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-sm text-gray-500">Cargando categorías...</p>
        </div>
      )}

      {/* ── Listado de Categorías Raíz y Subcategorías ────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-5">
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-6">
              <p className="font-body text-base text-gray-600 mb-4">
                Todavía no tenés categorías creadas.
              </p>
              <button
                type="button"
                onClick={openCreateRoot}
                className="px-6 py-2.5 bg-amber-700 text-white rounded-lg font-body text-sm font-medium hover:bg-amber-800"
              >
                Crear la primera categoría
              </button>
            </div>
          ) : (
            categories.map((cat, rootIndex) => (
              <div
                key={cat.id}
                className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Cabecera de Categoría Raíz */}
                <div className="p-4 sm:p-5 bg-gray-50/75 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Botones de orden arriba/abajo */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "up", categories)}
                        disabled={rootIndex === 0}
                        title="Subir en el menú"
                        className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-20 disabled:hover:bg-transparent"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(cat, "down", categories)}
                        disabled={rootIndex === categories.length - 1}
                        title="Bajar en el menú"
                        className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-20 disabled:hover:bg-transparent"
                      >
                        ▼
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-body text-base sm:text-lg font-bold text-gray-900">
                          {cat.name}
                        </h2>
                        {cat.isProtected && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200" title="Esta categoría es fundamental y no puede borrarse">
                            Base del negocio
                          </span>
                        )}
                        {!cat.isActive && (
                          <span className="bg-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Oculta
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="font-body text-xs text-gray-500 mt-0.5 max-w-lg">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones para la categoría raíz */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Toggle Activo */}
                    <button
                      type="button"
                      onClick={() => toggleActive(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        cat.isActive
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                          : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.isActive ? "✓ Visible en tienda" : "○ Oculta"}
                    </button>

                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
                    >
                      Editar
                    </button>

                    {/* Eliminar */}
                    {cat.isProtected ? (
                      <span
                        className="px-2.5 py-1.5 text-xs text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed border border-gray-200"
                        title="Categoría base protegida (no se puede borrar)"
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
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategorías / Marcas / Modelos */}
                <div className="p-4 sm:p-5 bg-white flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Subcategorías / Marcas ({cat.children?.length ?? 0})
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateSub(cat)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                    >
                      <span>+</span>
                      <span>Agregar subcategoría a {cat.name}</span>
                    </button>
                  </div>

                  {cat.children && cat.children.length > 0 ? (
                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                      {cat.children.map((sub, subIndex) => (
                        <li
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 bg-gray-50/40 hover:bg-gray-50 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {/* Orden subcategoría */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "up", cat.children)}
                                disabled={subIndex === 0}
                                className="p-0.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-20"
                                title="Subir"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOrder(sub as unknown as Category, "down", cat.children)}
                                disabled={subIndex === cat.children.length - 1}
                                className="p-0.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-20"
                                title="Bajar"
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-gray-400 font-body text-sm">↳</span>
                            <div>
                              <span className="font-body text-sm font-medium text-gray-900">
                                {sub.name}
                              </span>
                              {sub.description && (
                                <p className="font-body text-xs text-gray-500">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => openEdit(sub as unknown as Category, cat.name)}
                              className="px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(sub as unknown as Category);
                              }}
                              className="px-2.5 py-1 text-xs text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded transition-colors"
                            >
                              Borrar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-body text-xs text-gray-400 italic py-2">
                      Sin subcategorías específicas (los productos se asocian directamente a {cat.name}).
                    </p>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-body text-lg font-bold text-gray-900">
                {modal.mode === "create_root"
                  ? "Nueva Categoría Principal"
                  : modal.mode === "create_sub"
                  ? `Nueva Subcategoría en ${modal.parentName}`
                  : `Editar: ${formName}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-xs">
                  {modalError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block font-body text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={modal.mode === "create_sub" ? "Ej: Movado, Seiko, Anillos de Compromiso..." : "Ej: Relojes, Joyería, Platería..."}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-body text-base text-gray-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  required
                  autoFocus
                />
                <p className="font-body text-xs text-gray-500 mt-1">
                  El enlace web (URL) se genera automáticamente con este nombre.
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-body text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalle breve para guiar a los clientes o mejorar en Google..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-body text-sm text-gray-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 resize-none"
                />
              </div>

              {/* Orden en el menú */}
              <div>
                <label className="block font-body text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Posición / Orden en el menú
                </label>
                <input
                  type="number"
                  min="0"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg font-body text-sm text-gray-900 focus:outline-none focus:border-amber-600"
                />
                <p className="font-body text-xs text-gray-400 mt-1">
                  Los números más chicos aparecen primero (ej. 0, 1, 2...).
                </p>
              </div>

              {/* Visibilidad (en modo edición) */}
              {modal.mode === "edit" && (
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300"
                  />
                  <span className="font-body text-sm font-medium text-gray-800">
                    Visible en la tienda para los clientes
                  </span>
                </label>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-body text-sm font-semibold shadow disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar categoría"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h2 className="font-body text-lg font-bold text-gray-900">
              ¿Eliminar &quot;{deleteTarget.name}&quot;?
            </h2>

            {deleteError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
                <strong>No se pudo eliminar:</strong>
                <p className="mt-1 text-xs leading-relaxed">{deleteError}</p>
                <p className="mt-2 text-xs text-gray-600">
                  Para poder borrarla, primero reasigná o eliminá los productos y subcategorías que dependen de ella.
                </p>
              </div>
            ) : (
              <p className="font-body text-sm text-gray-600 leading-relaxed">
                Esta acción eliminará la categoría de forma permanente. Si tiene productos o subcategorías asociadas, el sistema no permitirá borrarla para proteger los datos.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-body text-sm font-medium hover:bg-gray-50"
              >
                {deleteError ? "Cerrar" : "Cancelar"}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-body text-sm font-semibold shadow disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
