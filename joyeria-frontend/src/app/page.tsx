/**
 * app/page.tsx — Home de Petrucci Joyería
 *
 * Estructura (de arriba a abajo):
 *  1. Hero — banner único edge-to-edge con carrusel y zoom-in al scroll
 *  2. Categorías — chips scrolleables
 *  3. Piezas Destacadas — 3 productos del catálogo
 *  4. CTA final — WhatsApp
 */

import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import CategoryChip from "@/components/catalog/CategoryChip";
import { api } from "@/lib/api";
import type { Metadata } from "next";
import type { Category } from "@/types/category";

export const metadata: Metadata = {
  title: "Petrucci Joyería — Anillos, Relojes y Piezas Artesanales",
  description:
    "Catálogo de joyas, relojes y trabajos personalizados de Petrucci Joyería. Anillos, cadenas, marroquinería y grabados. San Jorge, Santa Fe. Consultá por WhatsApp.",
};

// Carga las categorías raíz para la sección de exploración
async function CategorySection() {
  let categories: Category[] = [];
  try {
    const response = await api.catalog.getCategories();
    categories = response.categories.filter((c) => c.isActive && !c.parent);
  } catch {
    return null;
  }

  if (categories.length === 0) return null;

  return (
    <section
      id="colecciones"
      className="py-10 md:py-14 border-b border-petrucci-border bg-white"
      aria-labelledby="collections-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        {/* Encabezado */}
        <div className="mb-6">
          <p className="font-body text-[10px] tracking-[0.25em] uppercase text-petrucci-gray mb-1.5">
            Explorá la tienda
          </p>
          <h2
            id="collections-heading"
            className="font-display text-2xl md:text-4xl text-petrucci-black font-normal"
          >
            Nuestras Colecciones
          </h2>
        </div>

        {/* Chips — scrolleables en mobile, wrap en desktop */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible scrollbar-hide">
          {categories.map((cat) => (
            <CategoryChip key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA final con WhatsApp
function WhatsAppCTA() {
  return (
    <section
      className="py-14 md:py-20 bg-petrucci-cream text-center"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-xl px-6">
        <p className="font-body text-[10px] tracking-[0.25em] uppercase text-petrucci-gray mb-3">
          Atención personalizada
        </p>
        <h2
          id="cta-heading"
          className="font-display text-3xl md:text-4xl text-petrucci-black mb-4 font-normal"
        >
          ¿Buscás algo especial?
        </h2>
        <p className="font-body text-sm text-petrucci-gray leading-relaxed mb-8 max-w-sm mx-auto">
          Contanos qué tenés en mente. Podemos hacer grabados personalizados,
          diseños a medida o ayudarte a encontrar el regalo perfecto.
        </p>
        <a
          href="#contacto"
          className="inline-flex items-center gap-3 px-8 py-4 bg-petrucci-black text-petrucci-cream font-body text-xs tracking-[0.2em] uppercase hover:bg-petrucci-gold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-black focus-visible:ring-offset-2"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Consultá por WhatsApp
        </a>
      </div>
    </section>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* 1. Hero — banner único edge-to-edge a pantalla completa con efecto zoom al scroll */}
      <Hero />

      {/* 2. Categorías */}
      <Suspense fallback={<div className="h-28 bg-white" aria-hidden />}>
        <CategorySection />
      </Suspense>

      {/* 3. Piezas Destacadas */}
      <Suspense fallback={<div className="h-64 bg-white" aria-hidden />}>
        <FeaturedProducts />
      </Suspense>

      {/* 4. CTA final WhatsApp */}
      <WhatsAppCTA />
    </>
  );
}
