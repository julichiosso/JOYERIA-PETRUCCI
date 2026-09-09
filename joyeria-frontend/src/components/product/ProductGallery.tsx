"use client";

/**
 * src/components/product/ProductGallery.tsx
 * Galería de imágenes de alta resolución para Ficha de Producto.
 * Soporta navegación por miniaturas, gestos táctiles y vista ampliada (lightbox).
 */

import React, { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sortedImages = [...(images || [])].sort((a, b) => a.order - b.order);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const currentImage = sortedImages[selectedIndex] || null;

  const handleNext = () => {
    if (sortedImages.length <= 1) return;
    setSelectedIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const handlePrev = () => {
    if (sortedImages.length <= 1) return;
    setSelectedIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  if (!sortedImages.length || !currentImage) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-6 border border-gray-200">
        <svg className="w-16 h-16 mb-2 stroke-current opacity-40" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeWidth="1.5" />
        </svg>
        <p className="font-serif text-sm text-gray-500 uppercase tracking-widest">Petrucci Joyería</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── IMAGEN PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xs group">
        {!imageErrors[currentImage.id] ? (
          <Image
            src={currentImage.url}
            alt={currentImage.altText || `${productName} - Imagen ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImageErrors((prev) => ({ ...prev, [currentImage.id]: true }))}
            className="object-cover object-center cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
            onClick={() => setIsZoomOpen(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            Imagen no disponible
          </div>
        )}

        {/* Botón Lupa Zoom */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="Amplicar imagen"
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs text-gray-800 hover:text-black rounded-full shadow-md opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>

        {/* Flechas de navegación en la imagen principal (si hay más de 1 foto) */}
        {sortedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* ── BARRA DE MINIATURAS & INDICADOR DOTS ─────────────────────────── */}
      {sortedImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${idx === selectedIndex
                  ? "border-amber-800 ring-2 ring-amber-800/20"
                  : "border-gray-200 opacity-60 hover:opacity-100"
                }`}
            >
              <Image
                src={img.thumbnailUrl || img.url}
                alt={img.altText || `Miniatura ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── MODAL LIGHTBOX / ZOOM ────────────────────────────────────────── */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 text-white text-3xl font-bold p-2 z-10 hover:text-amber-400 cursor-pointer"
            >
              ✕
            </button>
            <Image
              src={currentImage.url}
              alt={currentImage.altText || productName}
              width={1200}
              height={1200}
              className="object-contain max-h-[85vh] w-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
