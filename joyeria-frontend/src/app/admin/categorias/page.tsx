"use client";

/**
 * app/admin/categorias/page.tsx
 * Gestión de categorías del panel admin.
 *
 * Lista las categorías existentes y permite activar/desactivar.
 * La creación y edición avanzada de categorías se puede agregar en una
 * próxima iteración — esta página cubre la necesidad básica del dueño:
 * ver qué categorías hay y controlar cuáles están activas.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/auth";
import type { Category } from "@/types/category";

interface CategoryListResponse {
  categories: Category[];
}

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Category[] | { categories: Category[] }>("/admin/categories")
      .then((res) => {
        const cats = Array.isArray(res) ? res : res?.categories || [];
        setCategories(cats);
        setLoading(false);
      })
      .catch((err: { status?: number; message?: string }) => {
        if (err.status === 401) {
          router.push("/admin/login");
        } else {
          setError(err.message ?? "No se pudieron cargar las categorías.");
          setLoading(false);
        }
      });
  }, [router]);

  const toggleActive = async (cat: Category) => {
    try {
      await adminFetch(`/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message ?? "No se pudo actualizar la categoría.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-body text-xl font-semibold text-gray-900">Categorías</h1>
        <p className="font-body text-xs text-gray-500 mt-1">
          Activá o desactivá categorías para que aparezcan en la tienda.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {categories.length === 0 ? (
            <p className="font-body text-sm text-gray-500 text-center py-12">
              No hay categorías configuradas todavía.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <li key={cat.id}>
                  {/* Categoría raíz */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-gray-900">{cat.name}</span>
                      {cat.isProtected && (
                        <span className="font-body text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          protegida
                        </span>
                      )}
                    </div>
                    <label className="relative cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cat.isActive}
                        onChange={() => !cat.isProtected && toggleActive(cat)}
                        disabled={cat.isProtected}
                        className="sr-only peer"
                        aria-label={`${cat.isActive ? "Desactivar" : "Activar"} ${cat.name}`}
                      />
                      <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${cat.isActive ? "bg-amber-600" : "bg-gray-300"} ${cat.isProtected ? "opacity-40 cursor-not-allowed" : ""}`} />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
                    </label>
                  </div>

                  {/* Sub-categorías */}
                  {cat.children && cat.children.length > 0 && (
                    <ul className="divide-y divide-gray-50 bg-gray-50/50">
                      {cat.children.map((sub) => (
                        <li key={sub.id} className="flex items-center justify-between px-4 py-2.5 pl-8">
                          <span className="font-body text-sm text-gray-700">
                            <span className="text-gray-400 mr-1.5">›</span>
                            {sub.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Aviso sobre gestión completa */}
      <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
        <p className="font-body text-xs text-amber-800">
          <strong>Nota:</strong> Para crear, renombrar o reorganizar categorías, contactá al administrador del sistema. Esta pantalla permite activar/desactivar categorías existentes.
        </p>
      </div>
    </div>
  );
}
