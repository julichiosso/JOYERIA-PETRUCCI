"use client";

/**
 * components/product/ProductDetailClient.tsx
 *
 * Componente cliente para la ficha de producto de PETRUCCI Joyería.
 * Toda la interactividad (galería, acordeones, selector de variante) vive aquí.
 *
 * Diseño referenciado del Stitch "Artisanal Luxury Editorial":
 *  - Galería con thumbnails verticales a la izquierda (desktop) / horizontales (mobile)
 *  - Acordeones de Medios de Pago, Envío y Local (cerrados por defecto, animación suave)
 *  - Compartir social minimalista
 *  - CTA WhatsApp de alta conversión
 */

import React, { useState } from "react";
import Image from "next/image";
import type { PublicProductResponse, ProductImage } from "@/types/product";
import WhatsAppInlineCTA from "@/components/conversion/WhatsAppInlineCTA";
import PriceOrConsult from "@/components/product/PriceOrConsult";

/* ─────────────── SECCIÓN: Acordeón ─────────────────────────────────────── */

interface AccordionItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    content: string;
}

const ACCORDION_ITEMS: AccordionItem[] = [
    {
        id: "pago",
        icon: (
            <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
                <path strokeLinecap="round" d="M2 10h20" strokeWidth="1.5" />
            </svg>
        ),
        label: "MEDIOS DE PAGO",
        content:
            "Aceptamos transferencia bancaria y efectivo en nuestro taller con descuento especial. Consulte opciones de cuotas y financiamiento por WhatsApp.",
    },
    {
        id: "envio",
        icon: (
            <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" strokeWidth="1.5" />
                <circle cx="18.5" cy="18.5" r="2.5" strokeWidth="1.5" />
            </svg>
        ),
        label: "MEDIOS DE ENVÍO",
        content:
            "Envíos asegurados sin cargo a todo el país mediante servicio de mensajería dedicado. Entrega express disponible en San Jorge y zona. Coordinamos el envío directamente con usted.",
    },
    {
        id: "local",
        icon: (
            <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 22s-8-5.5-8-12a8 8 0 0116 0c0 6.5-8 12-8 12z" />
                <circle cx="12" cy="10" r="2.5" strokeWidth="1.5" />
            </svg>
        ),
        label: "NUESTRO LOCAL",
        content:
            "Visitanos en nuestro taller artesanal de San Jorge, Santa Fe. Atención personalizada de lunes a viernes de 9 a 13 hs. Coordiná una visita por WhatsApp.",
    },
];

function Accordion({ item }: { item: AccordionItem }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-t border-gray-200">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 py-4 text-left cursor-pointer group"
                aria-expanded={open}
            >
                {item.icon}
                <span className="flex-1 font-body text-[11px] font-bold tracking-widest uppercase text-gray-900 group-hover:text-amber-800 transition-colors">
                    {item.label}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-60 opacity-100 pb-4" : "max-h-0 opacity-0"
                    }`}
            >
                <p className="font-body text-sm text-gray-600 leading-relaxed pl-7">{item.content}</p>
            </div>
        </div>
    );
}

/* ─────────────── SECCIÓN: Galería con Thumbnails ────────────────────────── */

interface GalleryProps {
    images: ProductImage[];
    productName: string;
}

function GalleryWithThumbs({ images, productName }: GalleryProps) {
    const sorted = [...images].sort((a, b) => a.order - b.order);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const current = sorted[selectedIdx];
    const hasMultiple = sorted.length > 1;

    if (!sorted.length || !current) {
        return (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 font-body text-sm">Sin imágenes</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row-reverse gap-3 w-full">
            {/* ── Imagen Principal ─────────────────────────────── */}
            <div className="relative flex-1 aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group cursor-zoom-in">
                {!errors[current.id] ? (
                    <Image
                        src={current.url}
                        alt={current.altText || `${productName} — imagen ${selectedIdx + 1}`}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 55vw"
                        onError={() => setErrors((p) => ({ ...p, [current.id]: true }))}
                        onClick={() => setIsZoomOpen(true)}
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="font-body text-xs">Imagen no disponible</span>
                    </div>
                )}

                {/* Botón ampliar */}
                <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    aria-label="Ver imagen ampliada"
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                </button>
            </div>

            {/* ── Columna de Thumbnails ──────────────────────────
         Vertical en desktop (izquierda), horizontal en mobile (abajo) */}
            {hasMultiple && (
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[520px] md:w-[90px] shrink-0 pb-1 md:pb-0 scrollbar-none">
                    {sorted.map((img, idx) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedIdx(idx)}
                            className={`relative w-[72px] h-[72px] md:w-[90px] md:h-[90px] shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${idx === selectedIdx
                                    ? "border-gray-900 ring-1 ring-gray-900/20"
                                    : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400"
                                }`}
                        >
                            <Image
                                src={img.thumbnailUrl || img.url}
                                alt={img.altText || `Miniatura ${idx + 1}`}
                                fill
                                sizes="90px"
                                className="object-cover object-center"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* ── Lightbox Modal ───────────────────────────────── */}
            {isZoomOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsZoomOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsZoomOpen(false)}
                        className="absolute top-5 right-5 text-white text-2xl font-light p-2 hover:text-amber-400 cursor-pointer z-10"
                        aria-label="Cerrar zoom"
                    >
                        ✕
                    </button>
                    <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={current.url}
                            alt={current.altText || productName}
                            width={1200}
                            height={1200}
                            className="object-contain max-h-[88vh] w-auto rounded-md"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────── SECCIÓN: Íconos Compartir ─────────────────────────────── */

function ShareRow({ productName, slug }: { productName: string; slug: string }) {
    const pageUrl = typeof window !== "undefined"
        ? `${window.location.origin}/productos/${slug}`
        : `https://petrucci.com.ar/productos/${slug}`;
    const text = encodeURIComponent(`Mirá esta joya de Petrucci: ${productName}`);
    const encodedUrl = encodeURIComponent(pageUrl);

    return (
        <div className="flex items-center gap-3 pt-5 border-t border-gray-200">
            <span className="font-body text-[11px] uppercase tracking-widest text-gray-500 font-semibold shrink-0">
                Compartir:
            </span>
            {/* Facebook */}
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir en Facebook"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
            >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            </a>
            {/* X / Twitter */}
            <a
                href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir en X"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
            >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </a>
            {/* Pinterest */}
            <a
                href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${text}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir en Pinterest"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
            >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
            </a>
        </div>
    );
}

/* ─────────────── COMPONENTE PRINCIPAL ──────────────────────────────────── */

interface ProductDetailClientProps {
    product: PublicProductResponse;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
    const parentCategory = product.category.parent;
    const categoryName = product.category.name;

    // Variantes: si tiene variantLabel como texto libre, lo mostramos como select
    const variantOptions = product.variantLabel
        ? product.variantLabel.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
            {/* ───── COLUMNA IZQUIERDA: Galería ───────────────────────── */}
            <GalleryWithThumbs images={product.images} productName={product.name} />

            {/* ───── COLUMNA DERECHA: Info + CTA ─────────────────────── */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">

                {/* Badges de estado & categoría */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block font-body text-[10px] font-bold tracking-[0.15em] uppercase bg-gray-900 text-white px-3 py-1 rounded-full">
                        {parentCategory ? parentCategory.name : categoryName}
                    </span>
                    {product.status === "OUT_OF_STOCK" && (
                        <span className="inline-block font-body text-[10px] font-bold tracking-widest uppercase bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full">
                            Sin Stock
                        </span>
                    )}
                </div>

                {/* H1 — Título */}
                <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.6rem] font-normal text-gray-950 leading-tight tracking-tight">
                    {product.name}
                </h1>

                {/* Sub-categoría de metal/material */}
                {parentCategory && (
                    <p className="font-body text-xs text-gray-500 tracking-widest uppercase -mt-3">
                        {categoryName}
                    </p>
                )}

                {/* ── Precio o Badge Consultar ─────────────────────────── */}
                <div className="pt-1 pb-2 border-b border-gray-100">
                    <PriceOrConsult
                        price={product.price}
                        showPrice={product.showPrice}
                        status={product.status}
                        whatsappUrl={product.whatsappLink}
                        productName={product.name}
                        size="lg"
                    />
                    {product.showPrice && product.price && (
                        <p className="font-body text-xs text-gray-500 mt-1.5">
                            Precio incluye IVA · Consultá financiamiento por WhatsApp
                        </p>
                    )}
                </div>

                {/* ── Selector de Variante ─────────────────────────────── */}
                {variantOptions.length > 1 ? (
                    <div className="flex flex-col gap-1.5">
                        <label className="font-body text-[11px] font-bold tracking-widest uppercase text-gray-700">
                            Acabado / Variante
                        </label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-white border border-gray-300 text-gray-900 font-body text-sm py-2.5 px-3 pr-8 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-pointer rounded-sm">
                                {variantOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                ) : product.variantLabel ? (
                    <div className="bg-[#FBF8F4] border border-[#C5A880]/50 rounded-sm px-4 py-3">
                        <span className="font-body text-[10px] font-bold uppercase tracking-widest text-[#8C6D3F] block mb-0.5">
                            Acabado & Variantes
                        </span>
                        <p className="font-body text-sm text-gray-800">{product.variantLabel}</p>
                    </div>
                ) : null}

                {/* ── CTA Principal WhatsApp ───────────────────────────── */}
                <div>
                    <WhatsAppInlineCTA
                        whatsappUrl={product.whatsappLink}
                        productName={product.name}
                        className="rounded-sm"
                    />
                    <p className="flex items-center justify-center gap-1.5 font-body text-[11px] text-gray-500 text-center mt-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Atención personalizada directa de nuestro taller artesanal
                    </p>
                </div>

                {/* ── Acordeones ──────────────────────────────────────── */}
                <div className="mt-2">
                    {ACCORDION_ITEMS.map((item) => (
                        <Accordion key={item.id} item={item} />
                    ))}
                    <div className="border-t border-gray-200" />
                </div>

                {/* ── Descripción del Producto ─────────────────────────── */}
                {product.description && (
                    <div className="pt-4 border-t border-gray-100">
                        <p className="font-body text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* ── Íconos de Confianza ──────────────────────────────── */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-body text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <span>Garantía de autenticidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🎁</span>
                        <span>Estuche artesanal incluido</span>
                    </div>
                </div>

                {/* ── Social Share ─────────────────────────────────────── */}
                <ShareRow productName={product.name} slug={product.slug} />
            </div>
        </div>
    );
}
