/**
 * app/[categorySlug]/[subSlug]/page.tsx
 * Subcategoría (ej: /joyeria/anillos, /joyeria/cadenas)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, subSlug } = await params;
  try {
    const { categories } = await api.catalog.getCategories();
    const parent = categories.find((c) => c.slug === categorySlug && !c.parent && c.isActive);
    const sub = parent?.children.find((c) => c.slug === subSlug);
    if (!sub) return {};
    return {
      title: `${sub.name} — Petrucci Joyería`,
      description: sub.description ?? `Catálogo de ${sub.name.toLowerCase()} · Consultá por WhatsApp.`,
    };
  } catch {
    return {};
  }
}

export default async function SubcategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug, subSlug } = await params;
  const { page: pageParam } = await searchParams;

  let parent = null;
  let subcategory = null;

  try {
    const { categories } = await api.catalog.getCategories();
    parent = categories.find((c) => c.slug === categorySlug && !c.parent && c.isActive) ?? null;
    subcategory = parent?.children.find((c) => c.slug === subSlug) ?? null;
  } catch {
    notFound();
  }

  if (!parent || !subcategory) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const LIMIT = 12;

  let products: Product[] = [];
  let pagination = { page: 1, totalPages: 1, total: 0 };

  try {
    const response = await api.catalog.getProducts({
      categoryId: subcategory.id,
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
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="border-b border-petrucci-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
          <nav aria-label="Migas de pan" className="mb-4">
            <ol className="flex items-center gap-1.5 font-body text-xs text-petrucci-gray">
              <li><Link href="/" className="hover:text-petrucci-gold transition-colors">Inicio</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href={`/${categorySlug}`} className="hover:text-petrucci-gold transition-colors">{parent.name}</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-petrucci-black" aria-current="page">{subcategory.name}</li>
            </ol>
          </nav>
          <h1 className="font-display text-3xl md:text-5xl text-petrucci-black">
            {subcategory.name}
          </h1>
          {subcategory.description && (
            <p className="mt-3 font-body text-sm text-petrucci-gray max-w-xl leading-relaxed">
              {subcategory.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Grilla ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-14">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-petrucci-gray mb-4">
              Aún no hay productos en esta sección.
            </p>
            <Link href={`/${categorySlug}`} className="font-body text-sm text-petrucci-gold hover:underline">
              ← Ver {parent.name}
            </Link>
          </div>
        ) : (
          <>
            <p className="font-body text-xs text-petrucci-gray mb-6">
              {pagination.total} pieza{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-14">
                {page > 1 && (
                  <Link href={`/${categorySlug}/${subSlug}?page=${page - 1}`} className="font-body text-sm text-petrucci-black hover:text-petrucci-gold border-b border-petrucci-black hover:border-petrucci-gold pb-0.5 transition-colors">
                    ← Anterior
                  </Link>
                )}
                <span className="font-body text-xs text-petrucci-gray">{page} / {pagination.totalPages}</span>
                {page < pagination.totalPages && (
                  <Link href={`/${categorySlug}/${subSlug}?page=${page + 1}`} className="font-body text-sm text-petrucci-black hover:text-petrucci-gold border-b border-petrucci-black hover:border-petrucci-gold pb-0.5 transition-colors">
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
