"use client";

/**
 * components/catalog/ProductCard.tsx
 * Tarjeta de producto idéntica a la referencia de Joyería El Rubí:
 *  - Foto limpia en proporción cuadrada
 *  - Badge "ENVÍO GRATIS" en rojo sólido arriba a la izquierda
 *  - Nombre en tipografía sans-serif natural (Inter)
 *  - Precio principal en negrita
 *  - Precio con 15% de descuento por transferencia bancaria debajo
 */

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice, getImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

function buildProductUrl(product: Product): string {
  const { slug, category } = product;
  if (category?.parent) {
    return `/${category.parent.slug}/${category.slug}/${slug}`;
  }
  return `/${category?.slug ?? "joyeria"}/${slug}`;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const productUrl = buildProductUrl(product);
  const mainImage = product.images?.find((img) => img.order === 0) ?? product.images?.[0];
  const formattedPrice = formatPrice(product.price);
  const isOutOfStock = product.status === "OUT_OF_STOCK";

  // Calcular precio con 10% de descuento por transferencia si hay precio numérico
  const numericPrice = product.showPrice && product.price ? parseFloat(product.price) : null;
  const transferPrice = numericPrice ? formatPrice(String(numericPrice * 0.85)) : null;

  return (
    <article className="group relative flex flex-col bg-white">
      {/* ── Foto del Producto ──────────────────────────────────────────────── */}
      <Link
        href={productUrl}
        className="relative block overflow-hidden bg-[#FAF9F7] aspect-square border border-gray-200/60 rounded-md"
        tabIndex={-1}
        aria-hidden="true"
      >
        {mainImage ? (
          <Image
            src={getImageUrl(mainImage.thumbnailUrl ?? mainImage.url)}
            alt={mainImage.altText ?? product.name}
            fill
            priority={priority}
            quality={85}
            className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-body">
            Sin foto
          </div>
        )}

        {/* Badge "ENVÍO GRATIS" en rojo sólido */}
        {!isOutOfStock && (
          <span className="absolute bottom-2.5 left-2.5 bg-[#b91c1c] text-white font-body text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
            Envío gratis
          </span>
        )}

        {/* Badge sin stock */}
        {isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 bg-black text-white font-body text-[9px] uppercase px-2 py-0.5 rounded-xs">
            Sin stock
          </span>
        )}
      </Link>

      {/* ── Información (Tipografía limpia sans-serif) ───────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-3 text-left">
        <Link
          href={productUrl}
          className="font-body text-xs sm:text-sm font-normal text-gray-900 hover:text-black hover:underline transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
        >
          {product.name}
        </Link>

        {/* Precios y Estados unificados en tamaño y peso */}
        <div className="pt-0.5 min-h-[2.75rem] flex flex-col justify-start">
          {product.showPrice && formattedPrice ? (
            <>
              <p className="font-body text-sm sm:text-base font-bold text-gray-900 leading-tight">
                {formattedPrice}
              </p>
              {transferPrice && (
                <p className="font-body text-[11px] text-gray-600 font-normal mt-0.5 leading-tight">
                  <span className="font-semibold text-gray-800">{transferPrice}</span> con Transferencia
                </p>
              )}
            </>
          ) : (
            <p className="font-body text-sm sm:text-base font-bold text-gray-900 leading-tight">
              Consultar precio por WhatsApp
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
