/**
 * app/[categorySlug]/[subSlug]/[productSlug]/page.tsx
 * Ficha de producto PETRUCCI — Server Component.
 *
 * Ruta canónica: /[categoría]/[subcategoría]/[slug-producto]
 * Usa ProductDetailClient para galería con thumbnails, acordeones y variantes.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string; productSlug: string }>;
}

/* ─── generateMetadata ──────────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(productSlug);
    return {
      title: `${product.name} | Petrucci Joyería`,
      description:
        product.description ||
        `Comprá ${product.name} en Petrucci Joyería. Piezas exclusivas y atención personalizada.`,
      openGraph: {
        title: `${product.name} | Petrucci Joyería`,
        description:
          product.description ||
          `Comprá ${product.name} en Petrucci Joyería. Piezas exclusivas.`,
        images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
      },
    };
  } catch {
    return {
      title: "Producto no encontrado | Petrucci Joyería",
    };
  }
}

/* ─── Página ────────────────────────────────────────────────────────────── */

export default async function ProductDetailPage({ params }: PageProps) {
  const { categorySlug, subSlug, productSlug } = await params;

  // 1. Cargar producto
  let product;
  try {
    product = await api.catalog.getProductBySlug(productSlug);
  } catch {
    notFound();
  }

  const categoryName = product.category.name;
  const parentCategoryName = product.category.parent?.name;

  // 2. Cargar productos relacionados
  let relatedProducts: Product[] = [];
  try {
    const response = await api.catalog.getProducts({
      categoryId: product.category.id,
      page: 1,
      limit: 5,
    });
    relatedProducts = response.items
      .filter((p) => p.status === "ACTIVE" && p.id !== product.id)
      .slice(0, 4);
  } catch {
    // Si falla la carga de relacionados, no rompemos la página
    relatedProducts = [];
  }

  const breadcrumbLinks = [
    { label: "Inicio", href: "/" },
    ...(parentCategoryName
      ? [
          { label: parentCategoryName, href: `/${categorySlug}` },
          { label: categoryName, href: `/${categorySlug}/${subSlug}` },
        ]
      : [{ label: categoryName, href: `/${categorySlug}` }]),
    { label: product.name, href: null },
  ];

  return (
    <>
      {/* ── JSON-LD ──────────────────────────────────────────────────── */}
      <Script
        id="json-ld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(product.jsonLd.product),
        }}
      />
      <Script
        id="json-ld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(product.jsonLd.breadcrumb),
        }}
      />

      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">

          {/* ── 1. BREADCRUMB ──────────────────────────────────────────── */}
          <nav aria-label="Migas de pan" className="mb-7 md:mb-10">
            <ol className="flex items-center flex-wrap gap-1 font-body text-xs text-gray-500">
              {breadcrumbLinks.map((crumb, index) => (
                <li key={index} className="flex items-center gap-1">
                  {index > 0 && (
                    <span aria-hidden="true" className="mx-0.5 text-gray-300">›</span>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-900 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900 truncate max-w-[180px]" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* ── 2. DETALLE DEL PRODUCTO ────────────────────────────────── */}
          <ProductDetailClient product={product} />

          {/* ── 3. PRODUCTOS RELACIONADOS ─────────────────────────────── */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 md:mt-24 pt-10 border-t border-gray-100">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[#111111]">
                    Productos relacionados
                  </h2>
                </div>
                <Link
                  href={`/${categorySlug}`}
                  className="text-xs text-gray-600 hover:text-black hover:underline transition-colors hidden sm:block font-medium"
                >
                  Ver más en {categoryName} →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
