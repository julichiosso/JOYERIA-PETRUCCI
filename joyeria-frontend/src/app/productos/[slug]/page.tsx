/**
 * app/productos/[slug]/page.tsx
 * Ficha de producto detallada de Petrucci Joyería.
 *
 * - Optimizado para conversión móvil a WhatsApp con cero fricción.
 * - Incluye Galería con lightbox, variantes informativas, precio o "Consultar"
 * - Inyección de metadatos SEO y JSON-LD.
 * - Productos relacionados de la misma categoría al pie.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductGallery from "@/components/product/ProductGallery";
import PriceOrConsult from "@/components/product/PriceOrConsult";
import WhatsAppInlineCTA from "@/components/conversion/WhatsAppInlineCTA";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const product = await api.catalog.getProductBySlug(slug);
        return {
            title: product.metaTitle || `${product.name} — Petrucci Joyería`,
            description: product.metaDescription || product.description || `Consultá por ${product.name} en Petrucci Joyería.`,
            openGraph: {
                title: product.metaTitle || product.name,
                description: product.metaDescription || product.description || undefined,
                images: product.images.length > 0 ? [product.images[0].url] : [],
                type: "website",
            },
        };
    } catch {
        return {
            title: "Producto — Petrucci Joyería",
        };
    }
}

export default async function PublicProductDetailPage({ params }: PageProps) {
    const { slug } = await params;

    let product;
    try {
        product = await api.catalog.getProductBySlug(slug);
    } catch {
        notFound();
    }

    // Cargar productos relacionados de la misma categoría
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

    // Construir migas de pan
    const categoryName = product.category.name;
    const parentCategory = product.category.parent;

    return (
        <>
            {/* ── SEO JSON-LD Injected by Backend ──────────────────────────────── */}
            {product.jsonLd?.product && (
                <Script
                    id="json-ld-product"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.product) }}
                />
            )}

            <div className="bg-white min-h-screen py-6 md:py-12">
                <div className="mx-auto max-w-7xl px-4 md:px-8">
                    {/* ── Breadcrumb ───────────────────────────────────────────────── */}
                    <nav aria-label="Migas de pan" className="mb-6">
                        <ol className="flex items-center flex-wrap gap-1.5 font-body text-xs text-gray-500">
                            <li>
                                <Link href="/" className="hover:text-gray-900 transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>›</li>
                            <li>
                                <Link href="/productos" className="hover:text-gray-900 transition-colors">
                                    Catálogo
                                </Link>
                            </li>
                            {parentCategory && (
                                <>
                                    <li>›</li>
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
                            <li>›</li>
                            <li>
                                <Link
                                    href={`/productos?categoria=${product.category.slug}`}
                                    className="hover:text-gray-900 transition-colors"
                                >
                                    {categoryName}
                                </Link>
                            </li>
                            <li>›</li>
                            <li className="font-semibold text-gray-900 truncate max-w-[200px]" aria-current="page">
                                {product.name}
                            </li>
                        </ol>
                    </nav>

                    {/* ── Grilla Ficha de Producto (Galería + Info) ────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
                        {/* Galería de Fotos (Columna Izquierda 7 cols) */}
                        <div className="lg:col-span-7">
                            <ProductGallery images={product.images} productName={product.name} />
                        </div>

                        {/* Detalles & CTA WhatsApp (Columna Derecha 5 cols sticky) */}
                        <div className="lg:col-span-5 flex flex-col justify-start gap-5 lg:sticky lg:top-24 lg:self-start">
                            {/* Categoría superior */}
                            <div className="flex items-center justify-between">
                                <span className="font-body text-xs font-semibold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                                    {parentCategory ? `${parentCategory.name} › ${categoryName}` : categoryName}
                                </span>

                                {product.status === "OUT_OF_STOCK" && (
                                    <span className="font-body text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                                        Sin Stock
                                    </span>
                                )}
                            </div>

                            {/* Título de la Joya */}
                            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-gray-950 leading-tight">
                                {product.name}
                            </h1>

                            {/* Precio o Badge Consultar */}
                            <div className="py-3 border-y border-gray-100 flex items-center justify-between">
                                <PriceOrConsult
                                    price={product.price}
                                    showPrice={product.showPrice}
                                    status={product.status}
                                    whatsappUrl={product.whatsappLink}
                                    productName={product.name}
                                    size="lg"
                                />
                            </div>

                            {/* Variantes Informativas si existen */}
                            {product.variantLabel && (
                                <div className="bg-gray-50 border border-gray-200/70 rounded-xl p-4">
                                    <span className="font-body text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                        Variantes & Acabados
                                    </span>
                                    <p className="font-body text-sm font-medium text-gray-800">
                                        {product.variantLabel}
                                    </p>
                                </div>
                            )}

                            {/* Descripción breve */}
                            {product.description && (
                                <div className="prose prose-sm prose-gray max-w-none">
                                    <p className="font-body text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Botón Principal de Conversión por WhatsApp */}
                            <div className="pt-2">
                                <WhatsAppInlineCTA
                                    whatsappUrl={product.whatsappLink}
                                    productName={product.name}
                                />
                                <p className="font-body text-[11px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Atención personalizada directa de nuestro taller artesanal
                                </p>
                            </div>

                            {/* Confianza / Beneficios */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs font-body text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-700 text-base">✨</span>
                                    <span>Garantía de autenticidad</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-700 text-base">🎁</span>
                                    <span>Estuche de regalo incluido</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Productos Relacionados ────────────────────────────────────── */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-16 md:mt-24 pt-12 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="font-serif text-2xl md:text-3xl font-medium text-gray-950">
                                        También te puede interesar
                                    </h2>
                                    <p className="font-body text-xs md:text-sm text-gray-500 mt-1">
                                        Otras piezas de la colección {categoryName}
                                    </p>
                                </div>

                                <Link
                                    href={`/productos?categoria=${product.category.slug}`}
                                    className="font-body text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 transition-colors"
                                >
                                    Ver más →
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {relatedProducts.map((rel) => (
                                    <ProductCard key={rel.id} product={rel} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
