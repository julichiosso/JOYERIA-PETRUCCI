/**
 * components/catalog/ProductCard.tsx
 * Tarjeta de producto para grillas de listado y sección "Piezas Destacadas".
 *
 * Maneja:
 *  - Imagen real (next/image optimizado) o placeholder si no hay foto
 *  - Precio visible u oculto según showPrice del backend (NUNCA mostrar precio
 *    si showPrice es false — la regla viene del backend, la respetamos aquí)
 *  - Badge de estado (sin stock, etc.)
 *  - Hover con zoom de imagen + botón "Ver pieza" que aparece
 *  - Link a la URL correcta del producto (estructura /cat/subcat/slug o /cat/slug)
 */

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  /** true para las primeras 3–4 cards visibles (LCP — mejora Lighthouse) */
  priority?: boolean;
}

/** Construye la URL de un producto según la jerarquía de categorías del backend */
function buildProductUrl(product: Product): string {
  const { slug, category } = product;
  if (category.parent) {
    return `/${category.parent.slug}/${category.slug}/${slug}`;
  }
  return `/${category.slug}/${slug}`;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const productUrl = buildProductUrl(product);
  const mainImage = product.images.find((img) => img.order === 0) ?? product.images[0];
  const formattedPrice = formatPrice(product.price);
  const isOutOfStock = product.status === "OUT_OF_STOCK";

  return (
    <article className="group relative flex flex-col">
      {/* ── Imagen ────────────────────────────────────────────────────────── */}
      <Link
        href={productUrl}
        className="relative block overflow-hidden bg-petrucci-border aspect-[3/4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold focus-visible:ring-offset-2"
        tabIndex={-1}
        aria-hidden="true"
      >
        {mainImage ? (
          <Image
            src={mainImage.thumbnailUrl ?? mainImage.url}
            alt={mainImage.altText ?? product.name}
            fill
            priority={priority}
            quality={80}
            className="object-cover object-center transition-transform duration-500 ease-[var(--ease-petrucci)] group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          /* Placeholder cuando no hay imagen */
          <div className="absolute inset-0 flex items-center justify-center bg-petrucci-border">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-petrucci-gray opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Badge sin stock */}
        {isOutOfStock && (
          <span className="absolute top-2 left-2 bg-petrucci-black text-petrucci-cream font-body text-[9px] tracking-[0.15em] uppercase px-2 py-0.5">
            Sin stock
          </span>
        )}

        {/* Overlay "Ver pieza" en hover */}
        <div className="absolute inset-0 bg-petrucci-black/0 group-hover:bg-petrucci-black/20 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span className="font-body text-[10px] tracking-[0.2em] uppercase text-white border border-white px-4 py-2 bg-petrucci-black/40 backdrop-blur-sm">
            Ver pieza
          </span>
        </div>
      </Link>

      {/* ── Info ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 pt-3">
        {/* Categoría (eyebrow) */}
        <span className="font-body text-[10px] tracking-[0.15em] uppercase text-petrucci-gray">
          {product.category.name}
        </span>

        {/* Nombre del producto */}
        <Link
          href={productUrl}
          className="font-display text-base md:text-lg text-petrucci-black hover:text-petrucci-gold transition-colors duration-200 leading-tight"
        >
          {product.name}
        </Link>

        {/* Precio o "Consultar precio" */}
        <p className="font-body text-sm font-medium text-petrucci-black mt-0.5">
          {product.showPrice && formattedPrice ? (
            formattedPrice
          ) : (
            <span className="text-petrucci-gray italic">Consultar precio</span>
          )}
        </p>
      </div>
    </article>
  );
}
