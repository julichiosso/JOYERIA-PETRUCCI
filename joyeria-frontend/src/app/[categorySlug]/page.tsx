/**
 * app/[categorySlug]/page.tsx
 * Página de categoría raíz (ej: /relojes, /personalizados, /marroquineria, /trabajos-personalizados)
 *
 * Server Component con:
 *  - generateMetadata() dinámica basada en la categoría
 *  - Grid de productos paginado
 *  - Breadcrumb
 *  - Búsqueda inteligente de slugs y alias (ej: /personalizados -> /trabajos-personalizados)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const RESERVED_SLUGS = ["admin", "nosotros", "api", "_next", "favicon.ico"];

function findMatchingCategory(categories: Category[], slug: string): Category | null {
  // 1. Coincidencia exacta raíz
  const exactRoot = categories.find((c) => c.slug === slug && c.isActive);
  if (exactRoot) return exactRoot;

  // 2. Coincidencia exacta subcategoría
  for (const root of categories) {
    const sub = root.children?.find((c) => c.slug === slug && c.isActive);
    if (sub) return sub;
  }

  // 3. Alias conocidos y coincidencias parciales
  const normalized = slug.toLowerCase();
  const aliasRoot = categories.find((c) => {
    if (!c.isActive) return false;
    const catSlug = c.slug.toLowerCase();
    if (normalized === "personalizados" && catSlug.includes("personalizado")) return true;
    if (normalized.includes("personalizado") && catSlug.includes("personalizado")) return true;
    if (normalized === "anillos" && catSlug.startsWith("anillo")) return true;
    if (normalized === "cadenas" && catSlug.startsWith("cadena")) return true;
    if (normalized === "relojes" && catSlug.startsWith("reloj")) return true;
    return catSlug.includes(normalized) || normalized.includes(catSlug);
  });
  if (aliasRoot) return aliasRoot;

  // 4. Subcategoría por alias parcial (ej: "anillos" -> "anillos-2")
  for (const root of categories) {
    const sub = root.children?.find((c) => {
      if (!c.isActive) return false;
      const subSlug = c.slug.toLowerCase();
      return subSlug.startsWith(normalized) || normalized.startsWith(subSlug);
    });
    if (sub) return sub;
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  if (RESERVED_SLUGS.includes(categorySlug)) return {};

  try {
    const { categories } = await api.catalog.getCategories();
    const category = findMatchingCategory(categories, categorySlug);
    if (!category) return {};

    return {
      title: `${category.name} — Petrucci Joyería`,
      description:
        category.description ??
        `Catálogo de ${category.name.toLowerCase()} en Petrucci Joyería. Consultá por WhatsApp.`,
      openGraph: {
        title: `${category.name} | Petrucci Joyería`,
        description: category.description ?? `Catálogo de ${category.name.toLowerCase()} · San Jorge, Santa Fe`,
      },
    };
  } catch {
    return {};
  }
}

export default async function CategoryRootPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;

  if (RESERVED_SLUGS.includes(categorySlug)) notFound();

  let category: Category | null = null;
  try {
    const { categories } = await api.catalog.getCategories();
    category = findMatchingCategory(categories, categorySlug);
  } catch {
    notFound();
  }

  if (!category) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const LIMIT = 12;

  let products: Product[] = [];
  let pagination = { page: 1, totalPages: 1, total: 0 };

  try {
    const response = await api.catalog.getProducts({
      categoryId: category.id,
      page,
      limit: LIMIT,
    });
    products = response.items.filter((p) => p.status === "ACTIVE");
    pagination = response.pagination;
  } catch {
    // grilla vacía
  }

  return (
    <>
      {/* ── Encabezado de categoría ──────────────────────────────────────── */}
      <div className="border-b border-petrucci-border bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Migas de pan" className="mb-4">
            <ol className="flex items-center gap-1.5 font-body text-xs text-petrucci-gray">
              <li><Link href="/" className="hover:text-petrucci-gold transition-colors">Inicio</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-petrucci-black" aria-current="page">{category.name}</li>
            </ol>
          </nav>

          <h1 className="font-display text-3xl md:text-5xl text-petrucci-black font-normal">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 font-body text-sm text-petrucci-gray max-w-xl leading-relaxed">
              {category.description}
            </p>
          )}

          {/* Sub-categorías si las hay */}
          {category.children && category.children.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-5">
              {category.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/${category.slug}/${sub.slug}`}
                  className="px-4 py-2 border border-petrucci-border font-body text-xs tracking-wide text-petrucci-black hover:border-petrucci-gold hover:text-petrucci-gold transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grilla de productos ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-14">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-petrucci-gray">
              Aún no hay productos disponibles en esta sección.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block font-body text-sm text-petrucci-gold hover:underline"
            >
              ← Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <p className="font-body text-xs text-petrucci-gray mb-6">
              {pagination.total} pieza{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-14">
                {page > 1 && (
                  <Link
                    href={`/${categorySlug}?page=${page - 1}`}
                    className="font-body text-sm text-petrucci-black hover:text-petrucci-gold border-b border-petrucci-black hover:border-petrucci-gold pb-0.5 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                <span className="font-body text-xs text-petrucci-gray">
                  {page} / {pagination.totalPages}
                </span>
                {page < pagination.totalPages && (
                  <Link
                    href={`/${categorySlug}?page=${page + 1}`}
                    className="font-body text-sm text-petrucci-black hover:text-petrucci-gold border-b border-petrucci-black hover:border-petrucci-gold pb-0.5 transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
