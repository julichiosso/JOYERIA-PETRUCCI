"use client";

/**
 * components/product/ProductGallery.tsx
 * Galería de imágenes interactiva para la página de detalle de producto.
 *
 * - Imagen principal grande
 * - Thumbnails horizontales scrolleables
 * - Click en thumbnail → cambia imagen principal
 * - Transición suave al cambiar
 * - Accesible: alt text en todas las imágenes
 */

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-petrucci-border flex items-center justify-center rounded-sm">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="text-petrucci-gray opacity-30">
          <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="17" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M4 32l12-10 10 8 8-6 14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div className="relative aspect-square bg-petrucci-border overflow-hidden rounded-sm">
        <Image
          key={activeIndex} // fuerza re-mount para la transición
          src={activeImage.url}
          alt={activeImage.altText ?? `${productName} — foto ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          quality={85}
          className="object-cover object-center transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails — solo si hay más de 1 imagen */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          role="list"
          aria-label="Fotos del producto"
        >
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              role="listitem"
              aria-label={`Ver foto ${index + 1}${img.altText ? `: ${img.altText}` : ""}`}
              aria-pressed={index === activeIndex}
              className={`
                relative shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-sm border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold
                ${index === activeIndex
                  ? "border-petrucci-black"
                  : "border-petrucci-border hover:border-petrucci-gray"}
              `}
            >
              <Image
                src={img.thumbnailUrl ?? img.url}
                alt={img.altText ?? `Foto ${index + 1} de ${productName}`}
                fill
                quality={60}
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
