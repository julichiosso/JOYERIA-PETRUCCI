import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import CategoryCatalogView from "@/components/catalog/CategoryCatalogView";
import type { Product } from "@/types/product";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  return {
    title: query ? `Búsqueda: "${query}" — Petrucci Joyería` : "Búsqueda de Joyas — Petrucci Joyería",
    description: `Resultados de búsqueda para ${query} en Petrucci Joyería. San Jorge, Santa Fe.`,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let products: Product[] = [];
  if (query) {
    try {
      const res = await api.catalog.getProducts({ search: query, limit: 50 });
      products = res.items.filter((p) => p.status === "ACTIVE");
    } catch {
      products = [];
    }
  }

  return (
    <div className="bg-white min-h-[70vh]">
      {/* ── Encabezado de búsqueda ────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10">
          <nav aria-label="Migas de pan" className="mb-3">
            <ol className="flex items-center gap-1.5 font-body text-xs text-gray-500">
              <li>
                <Link href="/" className="hover:text-black transition-colors">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-900 font-medium" aria-current="page">
                Búsqueda
              </li>
            </ol>
          </nav>

          <h1 className="font-display text-2xl md:text-4xl text-gray-950 font-normal">
            {query ? `Resultados para "${query}"` : "Búsqueda de productos"}
          </h1>
          <p className="mt-1 font-body text-xs md:text-sm text-gray-500">
            {products.length} pieza{products.length !== 1 ? "s" : ""} encontrada{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Grilla con Filtros y Orden ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        {products.length > 0 ? (
          <CategoryCatalogView
            initialProducts={products}
            categoryName={`Búsqueda: ${query}`}
          />
        ) : (
          <div className="py-16 text-center max-w-md mx-auto">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-gray-300 mb-4"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              No encontramos resultados para &quot;{query}&quot;
            </h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Revisá que la palabra esté bien escrita o explorá nuestras categorías de joyas, relojes y grabados personalizados.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-black transition-colors"
            >
              Ver todas las joyas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
