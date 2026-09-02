"use client";

/**
 * components/sections/FeaturedProducts.tsx
 * Sección "NOVEDADES" del home idéntica a Joyería El Rubí:
 *  - Título central NOVEDADES en tipografía sans-serif limpia y sobria
 *  - Grid de 4 columnas con botones laterales de desplazamiento (< y >)
 *  - Pure white background, sin fuentes de IA ni emojis
 */

import { useRef, useState, useEffect } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";
import { api } from "@/lib/api";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.catalog.getProducts({ limit: 12, page: 1 });
        setProducts(res.items.filter((p) => p.status === "ACTIVE"));
      } catch {
        // silenciar si no hay productos
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  if (loading || products.length === 0) return null;

  return (
    <section className="bg-white py-10 sm:py-14 border-b border-gray-100" aria-label="Novedades de la tienda">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Título Central "NOVEDADES" idéntico a El Rubí */}
        <h2 className="font-body text-base sm:text-lg font-bold tracking-[0.2em] text-gray-900 text-center uppercase mb-8 sm:mb-10">
          NOVEDADES
        </h2>

        {/* Carrusel de Productos con flechas laterales */}
        <div className="relative group">
          {/* Botón Flecha Izquierda */}
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Ver productos anteriores"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white border border-gray-200 shadow-md text-gray-700 hover:text-black hover:scale-105 transition-all rounded-full"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Grilla / Carrusel scrolleable */}
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(50%-0.625rem)] sm:auto-cols-[calc(33.333%-1rem)] lg:auto-cols-[calc(25%-1.125rem)] gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1"
          >
            {products.map((product, index) => (
              <div key={product.id} className="min-w-0">
                <ProductCard product={product} priority={index < 4} />
              </div>
            ))}
          </div>

          {/* Botón Flecha Derecha */}
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Ver productos siguientes"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white border border-gray-200 shadow-md text-gray-700 hover:text-black hover:scale-105 transition-all rounded-full"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
