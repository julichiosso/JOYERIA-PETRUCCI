/**
 * app/[categorySlug]/[subSlug]/[productSlug]/page.tsx
 * Ficha de producto PETRUCCI — Server Component.
 *
 * Ruta canónica: /[categoría]/[subcategoría]/[slug-producto]
 * Usa ProductDetailClient para galería con thumbnails, acordeones, variantes, social share.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string; productSlug: string }>;
}

/* ─── generateMetadata ──────────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(productSlug);
    const title = product.metaTitle || `${product.name} — Petrucci Joyería`;
    const description =
      product.metaDescription ||
      product.description ||
      `Consultá por "${product.name}" en Petrucci Joyería.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.images.length > 0 ? [product.images[0].url] : [],
        type: "website",
      },
    };
  } catch {
    return {};
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

  // 2. Validar que la URL coincide con la categoría real
  const expectedParentSlug = product.category.parent?.slug;
  const expectedCategorySlug = product.category.slug;
  const urlMatchesCategory = expectedParentSlug
    ? categorySlug === expectedParentSlug && subSlug === expectedCategorySlug
    : categorySlug === expectedCategorySlug;

  if (!urlMatchesCategory) notFound();

  // 3. Cargar productos relacionados
  let relatedProducts: Product[] = [];
  try {
    const res = await api.catalog.getProducts({
      categoryId: product.category.id,
      limit: 5,
    });
    relatedProducts = (res.items || []).filter((p) => p.id !== product.id).slice(0, 4);
  } catch {
    relatedProducts = [];
  }

  const categoryName = product.category.name;
  const parentCategory = product.category.parent;

  // Breadcrumb con URLs de la arquitectura de rutas existente
  const breadcrumbLinks = [
    { label: "Inicio", href: "/" },
    ...(parentCategory
      ? [
        { label: parentCategory.name, href: `/${parentCategory.slug}` },
        { label: categoryName, href: `/${parentCategory.slug}/${categoryName.toLowerCase()}` },
      ]
      : [{ label: categoryName, href: `/${categorySlug}` }]),
    { label: product.name, href: null },
  ];

  return (
    <>
      {/* ── JSON-LD ──────────────────────────────────────────────────── */}
      {product.jsonLd?.product && (
        <Script
          id="json-ld-product"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.product) }}
        />
      )}
      {product.jsonLd?.breadcrumb && (
        <Script
          id="json-ld-breadcrumb"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.breadcrumb) }}
        />
      )}

      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-5 md:px-10 py-6 md:py-10">

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
            <section className="mt-20 md:mt-28 pt-12 border-t border-gray-100">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-normal text-gray-950">
                    También te puede interesar
                  </h2>
                  <p className="font-body text-xs text-gray-500 mt-1">
                    Otras piezas de la colección {categoryName}
                  </p>
                </div>
                <Link
                  href={`/${categorySlug}`}
                  className="font-body text-[11px] font-bold uppercase tracking-widest text-amber-800 hover:text-amber-950 transition-colors hidden sm:block"
                >
                  Ver colección →
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
