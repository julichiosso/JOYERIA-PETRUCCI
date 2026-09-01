/**
 * components/sections/FeaturedProducts.tsx
 * Sección "Piezas Destacadas" del home: grilla de 3 productos.
 *
 * Server Component — fetch en servidor, sin hydration overhead en el cliente.
 * Muestra los primeros 3 productos activos del catálogo.
 * Si el backend no responde, la sección se omite silenciosamente.
 */

import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/catalog/ProductCard";

export default async function FeaturedProducts() {
  let products = [];

  try {
    const response = await api.catalog.getProducts({ limit: 3, page: 1 });
    products = response.items.filter((p) => p.status === "ACTIVE");
  } catch {
    // Si el backend no responde, se omite la sección sin error visible
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-6 md:px-10 py-16 md:py-20"
      aria-labelledby="featured-heading"
    >
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-10 md:mb-12">
        <div>
          <p className="font-body text-[10px] tracking-[0.25em] uppercase text-petrucci-gray mb-2">
            Selección especial
          </p>
          <h2
            id="featured-heading"
            className="font-display text-3xl md:text-4xl text-petrucci-black"
          >
            Piezas Destacadas
          </h2>
        </div>
        <Link
          href="/joyeria"
          className="hidden md:inline-flex items-center gap-1.5 font-body text-xs tracking-[0.15em] uppercase text-petrucci-black hover:text-petrucci-gold transition-colors border-b border-petrucci-black hover:border-petrucci-gold pb-0.5"
        >
          Ver todo el catálogo
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* ── Grilla de 3 productos ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 2} // LCP: las primeras 2 imágenes con priority
          />
        ))}
      </div>

      {/* Ver todo — solo visible en mobile */}
      <div className="mt-8 text-center md:hidden">
        <Link
          href="/joyeria"
          className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.15em] uppercase text-petrucci-black hover:text-petrucci-gold transition-colors border-b border-petrucci-black hover:border-petrucci-gold pb-0.5"
        >
          Ver todo el catálogo
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
