"use client";

/**
 * src/components/catalog/CategoryNav.tsx
 * Barra horizontal deslizable para explorar categorías principales y subcategorías.
 * Diseñada para respuesta inmediata en móviles (touch swipe).
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/types/category";

interface CategoryNavProps {
    categories: Category[];
    activeSlug?: string;
}

export default function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
    const pathname = usePathname();

    const isAllActive = pathname === "/productos" && !activeSlug;

    return (
        <nav className="w-full bg-white border-y border-gray-100 py-3 px-4 my-4 overflow-x-auto scrollbar-none flex items-center gap-2">
            {/* Opción "Todos los productos" */}
            <Link
                href="/productos"
                className={`px-4 py-2 rounded-full font-body text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${isAllActive
                        ? "bg-gray-950 text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
            >
                Todos
            </Link>

            {/* Lista de categorías de primer nivel */}
            {categories.map((cat) => {
                const isActive = activeSlug === cat.slug;
                return (
                    <Link
                        key={cat.id}
                        href={`/productos?categoria=${cat.slug}`}
                        className={`px-4 py-2 rounded-full font-body text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${isActive
                                ? "bg-gray-950 text-white shadow-xs"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {cat.name}
                    </Link>
                );
            })}
        </nav>
    );
}
