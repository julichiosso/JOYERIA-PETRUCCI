"use client";

/**
 * src/components/product/ProductCard.tsx
 * Tarjeta de producto minimalista de alta gama.
 * Fotografía limpia, tipografía legible y llamada a la acción / precio destacado.
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import PriceOrConsult from "./PriceOrConsult";

interface ProductCardProps {
    product: Product;
    priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
    const [imageError, setImageError] = useState(false);

    // Seleccionar la primera foto ordenada o la principal
    const sortedImages = product.images
        ? [...product.images].sort((a, b) => a.order - b.order)
        : [];
    const primaryImage = sortedImages[0];
    const secondaryImage = sortedImages[1];

    const mainImageUrl = primaryImage?.url || "/placeholder-jewelry.svg";
    const altText = primaryImage?.altText || product.name;

    return (
        <div className="group relative bg-white border border-gray-100/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col h-full">
            {/* ── IMAGEN DEL PRODUCTO ───────────────────────────────────────────── */}
            <Link
                href={`/productos/${product.slug}`}
                className="relative block aspect-square w-full bg-gray-50 overflow-hidden"
            >
                {!imageError && mainImageUrl ? (
                    <>
                        <Image
                            src={mainImageUrl}
                            alt={altText}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={priority}
                            onError={() => setImageError(true)}
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {/* Foto secundaria al hacer hover (si existe) */}
                        {secondaryImage?.url && (
                            <Image
                                src={secondaryImage.url}
                                alt={secondaryImage.altText || product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4">
                        <svg
                            className="w-10 h-10 mb-2 opacity-50 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeWidth="1.5" />
                        </svg>
                        <span className="text-[11px] font-body tracking-wider uppercase">
                            Petrucci Joyería
                        </span>
                    </div>
                )}

                {/* Badges de estado */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                    {product.status === "OUT_OF_STOCK" && (
                        <span className="bg-rose-900/90 text-white font-body text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs">
                            Sin Stock
                        </span>
                    )}
                </div>
            </Link>

            {/* ── DETALLES DE TEXTO ────────────────────────────────────────────── */}
            <div className="p-3.5 md:p-4 flex flex-col flex-1 justify-between gap-2.5">
                <div>
                    {/* Categoría superior */}
                    {product.category && (
                        <span className="font-body text-[10px] md:text-xs font-semibold tracking-widest uppercase text-gray-400 block mb-1">
                            {product.category.name}
                        </span>
                    )}

                    {/* Nombre del producto */}
                    <Link href={`/productos/${product.slug}`} className="block">
                        <h3 className="font-serif text-base md:text-lg font-medium text-gray-950 group-hover:text-black transition-colors line-clamp-2 leading-snug">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Label de variantes si aplica */}
                    {product.variantLabel && (
                        <p className="font-body text-[11px] text-gray-500 italic mt-1 line-clamp-1">
                            {product.variantLabel}
                        </p>
                    )}
                </div>

                {/* Precio o Botón Consultar */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <PriceOrConsult
                        price={product.price}
                        showPrice={product.showPrice}
                        status={product.status}
                        productName={product.name}
                        size="sm"
                    />
                </div>
            </div>
        </div>
    );
}
