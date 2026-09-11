/**
 * components/layout/AppShell.tsx
 *
 * Server Component: obtiene las categorías activas del backend UNA sola vez
 * por request (sin cacheo agresivo — los cambios de Víctor se reflejan al instante).
 * Pasa las categorías al client wrapper AppShellClient.
 */

import { api } from "@/lib/api";
import AppShellClient from "./AppShellClient";
import type { Category } from "@/types/category";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  let categories: Category[] = [];
  try {
    const data = await api.catalog.getCategories();
    categories = data.categories.filter((c) => c.isActive !== false);
  } catch {
    // Si el backend no responde, la nav se muestra vacía — no crashea la tienda.
  }

  return <AppShellClient categories={categories}>{children}</AppShellClient>;
}
