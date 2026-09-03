/**
 * app/page.tsx — Home de Petrucci Joyería
 *
 * Estructura (idéntica a Joyería El Rubí):
 *  1. Hero — banner edge-to-edge a pantalla completa con efecto zoom al scroll
 *  2. NOVEDADES — carrusel de productos de 4 columnas en tipografía limpia Inter
 *  3. WhatsApp CTA — atención personalizada
 */

import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import ProductCardSkeleton from "@/components/catalog/ProductCardSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petrucci Joyería — Anillos, Relojes y Piezas Artesanales",
  description:
    "Catálogo de joyas, relojes y trabajos personalizados de Petrucci Joyería. Anillos, cadenas, marroquinería y grabados. San Jorge, Santa Fe. Consultá por WhatsApp.",
};

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — banner edge-to-edge a pantalla completa con zoom suave al scroll */}
      <Hero />

      {/* 2. NOVEDADES — carrusel de productos directamente bajo el banner (como en El Rubí) */}
      <Suspense
        fallback={
          <section className="bg-white py-10 sm:py-14 border-b border-gray-100 min-h-[380px]" aria-label="Cargando novedades">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="h-5 bg-gray-200 rounded w-36 mx-auto mb-8 sm:mb-10 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            </div>
          </section>
        }
      >
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
