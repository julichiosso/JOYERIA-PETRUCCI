/**
 * app/productos/page.tsx
 * Catálogo público de productos de Petrucci Joyería.
 */

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import CategoryNav from "@/components/catalog/CategoryNav";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
    title: "Catálogo de Joyas y Relojes — Petrucci Joyería",
    description:
        "Explorá nuestro catálogo completo de anillos, cadenas, dijes, relojes y piezas personalizadas en oro y plata. Consultá por WhatsApp.",
};

interface ProductsPageProps {
    searchParams: Promise<{ categoria?: string; query?: string; orden?: string }>;
}

export default async function CatalogPage({ searchParams }: ProductsPageProps) {
    const { categoria, query } = await searchParams;

    // Cargar categorías
    let categoriesData: Awaited<ReturnType<typeof api.catalog.getCategories>> = { categories: [] };
    try {
        categoriesData = await api.catalog.getCategories();
    } catch {
        categoriesData = { categories: [] };
    }

    const categories = categoriesData.categories || [];
    const activeCategory = categories.find((c) => c.slug === categoria);

    // Cargar productos
    let products: Product[] = [];
    try {
        const productsRes = await api.catalog.getProducts({
            categoryId: activeCategory?.id,
            search: query,
            limit: 40,
        });
        products = (productsRes.items || []).filter((p) => p.status === "ACTIVE");
    } catch {
        products = [];
    }

    return (
        <div className="bg-gray-50/50 min-h-screen py-8 md:py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                {/* ── Breadcrumbs ──────────────────────────────────────────────── */}
                <nav aria-label="Breadcrumb" className="mb-4">
                    <ol className="flex items-center gap-2 font-body text-xs text-gray-500">
                        <li>
                            <Link href="/" className="hover:text-gray-900 transition-colors">
                                Inicio
                            </Link>
                        </li>
                        <li>›</li>
                        <li className="font-semibold text-gray-900" aria-current="page">
                            {activeCategory ? activeCategory.name : "Catálogo Completo"}
                        </li>
                    </ol>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-normal text-gray-950 tracking-tight">
                            {activeCategory ? activeCategory.name : "Catálogo de Joyas"}
                        </h1>
                        <p className="font-body text-sm text-gray-500 mt-1">
                            Piezas artesanales en oro, plata y alta relojería
                        </p>
                    </div>

                    <span className="font-body text-xs text-gray-400 font-medium">
                        Mostrando {products.length} productos
                    </span>
                </div>

                {/* ── CategoryNav ────────────────────────────────────────────── */}
                <CategoryNav categories={categories} activeSlug={categoria} />

                {/* ── Grid ───────────────────────────────────────────────────── */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                        {products.map((product, idx) => (
                            <ProductCard key={product.id} product={product} priority={idx < 4} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 my-8 max-w-md mx-auto shadow-2xs">
                        <svg
                            className="w-12 h-12 text-gray-300 mx-auto mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                            <path strokeLinecap="round" d="M12 8v4m0 4h.01" strokeWidth="2" />
                        </svg>
                        <h2 className="font-serif text-xl font-medium text-gray-900 mb-1">
                            No encontramos productos
                        </h2>
                        <p className="font-body text-sm text-gray-500 mb-6">
                            No hay piezas disponibles en esta categoría por el momento.
                        </p>
                        <Link
                            href="/productos"
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-950 text-white font-body text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-amber-800 transition-colors"
                        >
                            Ver todo el catálogo
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
