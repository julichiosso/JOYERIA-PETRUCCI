/**
 * app/[categorySlug]/[subSlug]/[productSlug]/page.tsx
 * Página de detalle de producto.
 *
 * - generateMetadata() con metaTitle, metaDescription y Open Graph
 * - Inyección de jsonLd (product + breadcrumb) de la API
 * - Galería de imágenes: principal + thumbnails
 * - CTA "Consultá por WhatsApp" usa whatsappLink de la API — NO se reconstruye aquí
 * - showPrice: false → NUNCA se muestra el precio (regla de negocio del backend)
 * - variantLabel: se muestra como texto informativo
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductGallery from "@/components/product/ProductGallery";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;

  try {
    const product = await api.catalog.getProductBySlug(productSlug);
    return {
      title: product.metaTitle,
      description: product.metaDescription,
      openGraph: {
        title: product.metaTitle,
        description: product.metaDescription,
        images: product.images.length > 0 ? [product.images[0].url] : [],
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { categorySlug, subSlug, productSlug } = await params;

  let product;
  try {
    product = await api.catalog.getProductBySlug(productSlug);
  } catch {
    notFound();
  }

  // Verificar que la URL coincide con la categoría real del producto
  // (evita que /cualquier-cosa/cualquier-cosa/slug funcione)
  const expectedParentSlug = product.category.parent?.slug;
  const expectedCategorySlug = product.category.slug;

  const urlMatchesCategory =
    expectedParentSlug
      ? categorySlug === expectedParentSlug && subSlug === expectedCategorySlug
      : categorySlug === expectedCategorySlug;

  if (!urlMatchesCategory) notFound();

  const formattedPrice = formatPrice(product.price);
  const sortedImages = [...product.images].sort((a, b) => a.order - b.order);

  // Breadcrumb construido desde la jerarquía de categorías
  const breadcrumbLinks = [
    { label: "Inicio", href: "/" },
    ...(product.category.parent
      ? [
          { label: product.category.parent.name, href: `/${product.category.parent.slug}` },
          { label: product.category.name, href: `/${product.category.parent.slug}/${product.category.slug}` },
        ]
      : [{ label: product.category.name, href: `/${product.category.slug}` }]),
    { label: product.name, href: null },
  ];

  return (
    <>
      {/* ── JSON-LD (product + breadcrumb) — ya construido por el backend ── */}
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
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
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

        {/* ── Layout principal: galería + info ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 lg:gap-20">

          {/* Galería */}
          <ProductGallery images={sortedImages} productName={product.name} />

          {/* Info del producto */}
          <div className="flex flex-col gap-5 md:sticky md:top-28 md:self-start">

            {/* Categoría eyebrow */}
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-petrucci-gray">
              {product.category.parent
                ? `${product.category.parent.name} › ${product.category.name}`
                : product.category.name}
            </p>

            {/* Nombre */}
            <h1 className="font-display text-3xl md:text-4xl leading-tight text-petrucci-black">
              {product.name}
            </h1>

            {/* Precio */}
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

            {/* Variantes — texto informativo (no selector) */}
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

            {/* Descripción */}
            {product.description && (
              <p className="font-body text-sm text-petrucci-gray leading-relaxed">
                {product.description}
              </p>
            )}

            {/* ── CTA Principal — USA whatsappLink DE LA API, NO SE RECONSTRUYE ── */}
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
