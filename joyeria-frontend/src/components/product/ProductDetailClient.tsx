"use client";

/**
 * components/product/ProductDetailClient.tsx
 *
 * Ficha de producto — PETRUCCI Joyeria & Marroquineria.
 * Directivas UX:
 *  - Cero carritos / pasarelas: conversion 100% por WhatsApp.
 *  - Galeria: thumbnails verticales a la IZQUIERDA, imagen principal a la derecha.
 *  - Tipografia consistente: Serif para nombres/titulos, sans-serif para labels/body.
 *  - Sin texto de relleno generico ni elementos de estilo "IA".
 *  - Sin seccion de envios (politica de la tienda).
 */

import React, { useState } from "react";
import Image from "next/image";
import type { PublicProductResponse, ProductImage } from "@/types/product";
import { formatPrice } from "@/lib/utils";

/* ---------- SWATCH HELPERS ------------------------------------------------ */

interface SwatchInfo {
  hex: string;
  borderHex?: string;
}

function getSwatchColor(name: string): SwatchInfo {
  const lower = name.toLowerCase();
  if (lower.includes("marron") || lower.includes("suela") || lower.includes("habano") || lower.includes("tan"))
    return { hex: "#7A4325" };
  if (lower.includes("borgona") || lower.includes("vino") || lower.includes("rojo") || lower.includes("bordeaux"))
    return { hex: "#561420" };
  if (lower.includes("negro") || lower.includes("black"))
    return { hex: "#171717" };
  if (lower.includes("oro blanco") || lower.includes("platino"))
    return { hex: "#E5E4E2", borderHex: "#CCCCCC" };
  if (lower.includes("oro rosa") || lower.includes("rose"))
    return { hex: "#E8A399" };
  if (lower.includes("oro"))
    return { hex: "#D4AF37" };
  if (lower.includes("plata y oro") || lower.includes("bicolor"))
    return { hex: "#C5A880", borderHex: "#C0C0C0" };
  if (lower.includes("plata"))
    return { hex: "#C8C8C8" };
  if (lower.includes("acero"))
    return { hex: "#8A959E" };
  if (lower.includes("verde") || lower.includes("esmeralda"))
    return { hex: "#1B4D3E" };
  if (lower.includes("azul") || lower.includes("marino"))
    return { hex: "#1B2A4A" };
  return { hex: "#A3927C" };
}

/* ---------- ACORDEON ------------------------------------------------------ */

interface AccordionItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

function Accordion({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[#E5E5E5]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#111111]">
          {item.label}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"}`}>
        <div className="text-[13px] text-gray-600 leading-relaxed">{item.content}</div>
      </div>
    </div>
  );
}

/* ---------- GALERIA ------------------------------------------------------- */

interface GalleryProps {
  images: ProductImage[];
  productName: string;
}

function Gallery({ images, productName }: GalleryProps) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const current = sorted[selectedIdx];
  const hasMultiple = sorted.length > 1;

  if (!sorted.length || !current) {
    return (
      <div className="aspect-[3/4] bg-[#F5F5F3] flex items-center justify-center">
        <span className="text-gray-400 text-xs tracking-widest uppercase">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3">
      {/* Thumbnails a la IZQUIERDA */}
      {hasMultiple && (
        <div className="flex flex-col gap-2 w-[72px] md:w-[80px] shrink-0">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
              className={`relative w-[72px] h-[72px] md:w-[80px] md:h-[80px] shrink-0 overflow-hidden cursor-pointer transition-all duration-150 ${
                idx === selectedIdx ? "ring-1 ring-[#111111]" : "opacity-55 hover:opacity-80"
              }`}
            >
              <Image
                src={img.thumbnailUrl || img.url}
                alt={img.altText || `Vista ${idx + 1}`}
                fill sizes="80px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Imagen principal */}
      <div
        className="relative flex-1 aspect-[3/4] bg-[#F8F7F5] overflow-hidden cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
      >
        {!errors[current.id] ? (
          <Image
            src={current.url}
            alt={current.altText || productName}
            fill priority
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setErrors((p) => ({ ...p, [current.id]: true }))}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-xs">Imagen no disponible</span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          aria-label="Ampliar imagen"
          className="absolute bottom-4 right-4 p-2 bg-white/90 text-gray-700 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-4 md:p-10"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-6 text-white/70 hover:text-white text-3xl font-light p-2 cursor-pointer z-10"
            aria-label="Cerrar"
          >
            &#x2715;
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.altText || productName}
              width={1600} height={2000}
              className="object-contain max-h-[88vh] w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- COMPONENTE PRINCIPAL ------------------------------------------ */

interface ProductDetailClientProps {
  product: PublicProductResponse;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const categoryName = product.category.name;
  const parentName = product.category.parent?.name ?? "";

  const variants = product.variantLabel
    ? product.variantLabel.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
    : [];

  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants.length > 0 ? variants[0] : ""
  );

  const whatsappUrl = (() => {
    const baseNumber = "5493406419736";
    let msg = `Hola, quisiera consultar por "${product.name}"`;
    if (selectedVariant) msg += ` (${selectedVariant})`;
    msg += `. Tienen disponibilidad?`;
    return `https://wa.me/${baseNumber}?text=${encodeURIComponent(msg)}`;
  })();

  const formattedPrice = formatPrice(product.price);
  const breadcrumbCategory = [parentName, categoryName].filter(Boolean).join(" / ");

  const accordionItems: AccordionItem[] = [
    {
      id: "descripcion",
      label: "Descripcion",
      content: product.description ? (
        <p className="whitespace-pre-line">{product.description}</p>
      ) : (
        <p>Consultanos por WhatsApp para mas detalles sobre esta pieza.</p>
      ),
    },
    {
      id: "cuidados",
      label: "Cuidados y Garantia",
      content: (
        <div className="space-y-2">
          <p>Cada pieza Petrucci cuenta con <strong>garantia de autenticidad</strong> sobre sus materiales.</p>
          <p>Para conservarla en optimas condiciones, evite el contacto con solventes o abrasivos. Ofrecemos servicio de mantenimiento y limpieza en nuestro local.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

      {/* Galeria */}
      <div className="lg:col-span-7">
        <Gallery images={product.images} productName={product.name} />
      </div>

      {/* Panel de informacion */}
      <div className="lg:col-span-5 flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start">

        {/* Breadcrumb */}
        {breadcrumbCategory && (
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-medium">
            {breadcrumbCategory}
          </p>
        )}

        {/* Nombre */}
        <div>
          <h1 className="font-serif text-[2rem] md:text-[2.4rem] leading-[1.15] text-[#111111] font-normal tracking-tight">
            {product.name}
          </h1>
          {product.status === "OUT_OF_STOCK" && (
            <p className="mt-2 text-[11px] tracking-[0.14em] uppercase text-gray-500">
              Sin stock momentaneo — consulta reposicion
            </p>
          )}
        </div>

        {/* Precio */}
        {product.showPrice && formattedPrice && (
          <div className="border-t border-b border-[#E5E5E5] py-4">
            <span className="text-2xl md:text-3xl font-semibold text-[#111111]">
              {formattedPrice}
            </span>
          </div>
        )}

        {/* Variantes */}
        {variants.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.15em] uppercase text-gray-600 font-medium">Variante</span>
              <span className="text-[12px] font-semibold text-[#111111]">{selectedVariant}</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {variants.map((variant) => {
                const swatch = getSwatchColor(variant);
                const isSelected = selectedVariant === variant;
                return (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    title={variant}
                    className={`flex items-center gap-2 px-3 py-2 text-[12px] border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border-[#111111] text-[#111111] shadow-sm"
                        : "border-[#E0E0E0] text-gray-600 hover:border-[#111111]"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border"
                      style={{ background: swatch.hex, borderColor: swatch.borderHex ?? "rgba(0,0,0,0.15)" }}
                    />
                    {variant}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA WhatsApp */}
        <div className="flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#111111] text-white text-[12px] tracking-[0.18em] uppercase font-semibold flex items-center justify-center gap-3 hover:bg-[#222] transition-colors duration-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Consultar por WhatsApp
          </a>
          <p className="text-center text-[11px] text-gray-400">Te respondemos a la brevedad</p>
        </div>

        {/* Acordeones */}
        <div className="border-t border-[#E5E5E5] mt-1">
          {accordionItems.map((item) => (
            <Accordion key={item.id} item={item} />
          ))}
        </div>

      </div>
    </div>
  );
}
