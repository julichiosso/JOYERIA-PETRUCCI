/**
 * app/[categorySlug]/page.tsx
 * Página de categoría raíz con filtros, orden y paginación.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import CategoryCatalogView from "@/components/catalog/CategoryCatalogView";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const RESERVED_SLUGS = ["admin", "nosotros", "api", "_next", "favicon.ico"];

function toFullCategory(sub: Category["children"][0], root: Category): Category {
  return {
    id: sub.id,
    name: sub.name,
    slug: sub.slug,
    description: sub.description,
    sortOrder: sub.sortOrder,
    isActive: sub.isActive ?? true,
    isProtected: sub.isProtected ?? false,
    parent: { id: root.id, name: root.name, slug: root.slug },
    children: [],
  };
}

function findMatchingCategory(categories: Category[], slug: string): Category | null {
  const exactRoot = categories.find((c) => c.slug === slug && (c.isActive ?? true));
  if (exactRoot) return exactRoot;

  for (const root of categories) {
    const sub = root.children?.find((c) => c.slug === slug && (c.isActive ?? true));
    if (sub) return toFullCategory(sub, root);
  }

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

  for (const root of categories) {
    const sub = root.children?.find((c) => {
      if (!c.isActive) return false;
      const subSlug = c.slug.toLowerCase();
      return subSlug.startsWith(normalized) || normalized.startsWith(subSlug);
    });
    if (sub) return toFullCategory(sub, root);
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
  const LIMIT = 40;

  let products: Product[] = [];
  try {
    const response = await api.catalog.getProducts({
      categoryId: category.id,
      page,
      limit: LIMIT,
    });
    products = response.items.filter((p) => p.status === "ACTIVE");
  } catch {
    // grilla vacía
  }

  return (
    <>
      {/* ── Encabezado de categoría ──────────────────────────────────────── */}
      <div className="border-b border-petrucci-border bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
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

          {/* Sub-categorías / Marcas como pills */}
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

      {/* ── Catálogo con Filtros y Orden ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
        <CategoryCatalogView
          initialProducts={products}
          categoryName={category.name}
        />
      </div>
    </>
  );
}
