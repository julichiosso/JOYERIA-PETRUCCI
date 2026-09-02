/**
 * app/[categorySlug]/[subSlug]/page.tsx
 *
 * Maneja dinámicamente:
 *  1. Subcategoría (ej: /joyeria/anillos-2) -> Muestra listado de productos con filtros y orden
 *  2. Detalle de producto cuando pertenece directamente a categoría raíz (ej: /joyeria/anillo-de-plata-925-con-circonia)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import CategoryCatalogView from "@/components/catalog/CategoryCatalogView";
import ProductGallery from "@/components/product/ProductGallery";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, subSlug } = await params;
  try {
    const { categories } = await api.catalog.getCategories();
    const parent = categories.find((c) => {
      if (!c.isActive) return false;
      const s = c.slug.toLowerCase();
      const target = categorySlug.toLowerCase();
      return s === target || s.includes(target) || target.includes(s);
    });

    const sub = parent?.children?.find((c) => {
      if (c.isActive === false) return false;
      const s = c.slug.toLowerCase();
      const target = subSlug.toLowerCase();
      return s === target || s.startsWith(target) || target.startsWith(s);
    });

    if (sub) {
      return {
        title: `${sub.name} — Petrucci Joyería`,
        description: sub.description ?? `Catálogo de ${sub.name.toLowerCase()} · Consultá por WhatsApp.`,
      };
    }

    // Probar si es producto
    const product = await api.catalog.getProductBySlug(subSlug);
    if (product) {
      return {
        title: product.metaTitle,
        description: product.metaDescription,
        openGraph: {
          title: product.metaTitle,
          description: product.metaDescription,
          images: product.images.length > 0 ? [product.images[0].url] : [],
        },
      };
    }
  } catch {
    // fallback
  }
  return {};
}

export default async function SubcategoryOrProductPage({ params, searchParams }: PageProps) {
  const { categorySlug, subSlug } = await params;
  const { page: pageParam } = await searchParams;

  let parent = null;
  let subcategory = null;
  let isSubcategory = false;

  try {
    const { categories } = await api.catalog.getCategories();
    parent = categories.find((c) => {
      if (!c.isActive) return false;
      const s = c.slug.toLowerCase();
      const target = categorySlug.toLowerCase();
      return s === target || s.includes(target) || target.includes(s);
    }) ?? null;

    if (parent) {
      subcategory = parent.children?.find((c) => {
        if (c.isActive === false) return false;
        const s = c.slug.toLowerCase();
        const target = subSlug.toLowerCase();
        return s === target || s.startsWith(target) || target.startsWith(s);
      }) ?? null;
      isSubcategory = Boolean(subcategory);
    }
  } catch {
    // continúa a probar producto
  }

  // ── CASO 1: Es una subcategoría ─────────────────────────────────────────────
  if (isSubcategory && subcategory && parent) {
    const page = Math.max(1, parseInt(pageParam ?? "1", 10));
    const LIMIT = 40;

    let products: Product[] = [];
    try {
      const response = await api.catalog.getProducts({
        categoryId: subcategory.id,
        page,
        limit: LIMIT,
      });
      products = response.items.filter((p) => p.status === "ACTIVE");
    } catch {
      // grilla vacía
    }

    return (
      <>
        {/* Encabezado subcategoría */}
        <div className="border-b border-petrucci-border bg-white">
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
            <h1 className="font-display text-3xl md:text-5xl text-petrucci-black font-normal">
              {subcategory.name}
            </h1>
            {subcategory.description && (
              <p className="mt-3 font-body text-sm text-petrucci-gray max-w-xl leading-relaxed">
                {subcategory.description}
              </p>
            )}
          </div>
        </div>

        {/* Catálogo con Filtros y Orden */}
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
          <CategoryCatalogView
            initialProducts={products}
            categoryName={subcategory.name}
          />
        </div>
      </>
    );
  }

  // ── CASO 2: Es un producto de categoría directa ─────────────────────────────
  let product;
  try {
    product = await api.catalog.getProductBySlug(subSlug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const formattedPrice = formatPrice(product.price);
  const sortedImages = [...product.images].sort((a, b) => a.order - b.order);

  const breadcrumbLinks = [
    { label: "Inicio", href: "/" },
    { label: product.category.name, href: `/${product.category.slug}` },
    { label: product.name, href: null },
  ];

  return (
    <>
      <Script
        id="json-ld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.product) }}
      />
      <Script
        id="json-ld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.breadcrumb) }}
      />

      <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="mb-8">
          <ol className="flex items-center flex-wrap gap-1.5 font-body text-xs text-petrucci-gray">
            {breadcrumbLinks.map((crumb, index) => (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-petrucci-gold transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-petrucci-black" aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Layout principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 lg:gap-20">
          <ProductGallery images={sortedImages} productName={product.name} />

          <div className="flex flex-col gap-5 md:sticky md:top-28 md:self-start">
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-petrucci-gray">
              {product.category.name}
            </p>

            <h1 className="font-display text-3xl md:text-4xl leading-tight text-petrucci-black font-normal">
              {product.name}
            </h1>

            <div className="py-3 border-t border-b border-petrucci-border">
              {product.showPrice && formattedPrice ? (
                <p className="font-body text-2xl font-semibold text-petrucci-black">
                  {formattedPrice}
                </p>
              ) : (
                <p className="font-body text-sm text-petrucci-gray italic">
                  Consultá el precio por WhatsApp
                </p>
              )}
            </div>

            {product.variantLabel && (
              <div className="bg-petrucci-cream border border-petrucci-border rounded-sm px-4 py-3">
                <p className="font-body text-xs tracking-wide text-petrucci-gray uppercase mb-1">
                  Variantes disponibles
                </p>
                <p className="font-body text-sm text-petrucci-black">
                  {product.variantLabel}
                </p>
              </div>
            )}

            {product.description && (
              <p className="font-body text-sm text-petrucci-gray leading-relaxed">
                {product.description}
              </p>
            )}

            <a
              href={product.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-petrucci-black text-petrucci-cream font-body text-sm tracking-[0.15em] uppercase hover:bg-petrucci-gold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-black focus-visible:ring-offset-2 mt-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Consultá por WhatsApp
            </a>
            <p className="font-body text-xs text-petrucci-gray text-center">
              Te respondemos a la brevedad · Coordinamos tu compra hoy mismo
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
