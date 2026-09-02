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
      <Suspense fallback={<div className="h-96 bg-white" aria-hidden />}>
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
