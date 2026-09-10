/**
 * app/productos/[slug]/page.tsx
 * Ficha de producto PETRUCCI Joyería — Server Component.
 *
 * Estructura:
 *  1. Breadcrumb (SSR)
 *  2. ProductDetailClient (galería thumbnails, acordeones, variante, CTA WhatsApp, social share)
 *  3. Productos relacionados
 *
 * Diseño inspirado en Stitch "Artisanal Luxury Editorial":
 *  - Tipografía: Cormorant / Proxima Nova del sitio existente
 *  - Paleta: #111827 primario, #C5A880 dorado hoja, #25D366 WhatsApp
 *  - Minimalismo extremo, espacio en blanco generoso
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import type { Product } from "@/types/product";

interface PageProps {
    params: Promise<{ slug: string }>;
}

/* ─── generateMetadata ──────────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const product = await api.catalog.getProductBySlug(slug);
        const title = product.metaTitle || `${product.name} — Petrucci Joyería`;
        const description =
            product.metaDescription ||
            product.description ||
            `Consultá por "${product.name}" en Petrucci Joyería. Piezas artesanales en oro y plata.`;

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
        return { title: "Producto — Petrucci Joyería" };
    }
}

/* ─── Página Principal ──────────────────────────────────────────────────── */

export default async function PublicProductDetailPage({ params }: PageProps) {
    const { slug } = await params;

    // 1. Cargar producto
    let product;
    try {
        product = await api.catalog.getProductBySlug(slug);
    } catch {
        notFound();
    }

    // 2. Cargar productos relacionados
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

    return (
        <>
            {/* ── JSON-LD de backend ────────────────────────────────────────── */}
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
                <div className="mx-auto max-w-7xl px-5 md:px-8 py-6 md:py-10">

                    {/* ── 1. BREADCRUMB ─────────────────────────────────────────────── */}
                    <nav aria-label="Migas de pan" className="mb-7 md:mb-10">
                        <ol className="flex items-center flex-wrap gap-1 font-body text-xs text-gray-500">
                            <li>
                                <Link href="/" className="hover:text-gray-900 transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li className="select-none mx-0.5 text-gray-300">›</li>

                            <li>
                                <Link href="/productos" className="hover:text-gray-900 transition-colors">
                                    Catálogo
                                </Link>
                            </li>

                            {parentCategory && (
                                <>
                                    <li className="select-none mx-0.5 text-gray-300">›</li>
                                    <li>
                                        <Link
                                            href={`/productos?categoria=${parentCategory.slug}`}
                                            className="hover:text-gray-900 transition-colors"
                                        >
                                            {parentCategory.name}
                                        </Link>
                                    </li>
                                </>
                            )}

                            <li className="select-none mx-0.5 text-gray-300">›</li>
                            <li>
                                <Link
                                    href={`/productos?categoria=${product.category.slug}`}
                                    className="hover:text-gray-900 transition-colors"
                                >
                                    {categoryName}
                                </Link>
                            </li>

                            <li className="select-none mx-0.5 text-gray-300">›</li>
                            <li className="font-medium text-gray-900 truncate max-w-[200px]" aria-current="page">
                                {product.name}
                            </li>
                        </ol>
                    </nav>

                    {/* ── 2. DETALLE DEL PRODUCTO (Client Component) ─────────────────── */}
                    <ProductDetailClient product={product} />

                    {/* ── 3. PRODUCTOS RELACIONADOS ───────────────────────────────────── */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-16 md:mt-24 pt-10 border-t border-gray-100">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[#111111]">
                                        Productos relacionados
                                    </h2>
                                </div>
                                <Link
                                    href={`/productos?categoria=${product.category.slug}`}
                                    className="text-xs text-gray-600 hover:text-black hover:underline transition-colors hidden sm:block font-medium"
                                >
                                    Ver más en {categoryName} →
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                                {relatedProducts.map((rel) => (
                                    <ProductCard key={rel.id} product={rel} />
                                ))}
                            </div>

                            <div className="sm:hidden text-center mt-6">
                                <Link
                                    href={`/productos?categoria=${product.category.slug}`}
                                    className="inline-block text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-black hover:underline transition-colors"
                                >
                                    Ver toda la colección →
                                </Link>
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </>
    );
}
