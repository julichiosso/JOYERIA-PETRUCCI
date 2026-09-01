/**
 * components/catalog/CategoryChip.tsx
 * Chip/pill de categoría para la sección "Explorar colecciones" del home.
 *
 * Cambio de diseño respecto al placeholder original (CategoryCircle):
 * en vez de círculos estilo Instagram, usamos chips rectangulares con borde
 * dorado sutil — más legibles en mobile y más alineados con la estética
 * minimalista de la marca.
 *
 * Server Component — sin estado.
 */

import Link from "next/link";
import type { Category } from "@/types/category";

interface CategoryChipProps {
  category: Category;
}

/** Devuelve el emoji/ícono representativo de cada categoría */
function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    anillos: "💍",
    relojes: "⌚",
    cadenas: "📿",
    personalizados: "✨",
    marroquineria: "👜",
    mates: "🧉",
  };
  return icons[slug] ?? "✦";
}

/** Construye la URL de la categoría según si tiene padre o no */
function buildCategoryUrl(category: Category): string {
  if (category.parent) {
    return `/${category.parent.slug}/${category.slug}`;
  }
  return `/${category.slug}`;
}

export default function CategoryChip({ category }: CategoryChipProps) {
  const url = buildCategoryUrl(category);
  const icon = getCategoryIcon(category.slug);

  return (
    <Link
      href={url}
      className="group flex items-center gap-2.5 px-4 py-3 border border-petrucci-border bg-white hover:border-petrucci-gold hover:bg-petrucci-cream transition-all duration-200 rounded-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold"
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      <span className="font-body text-[11px] tracking-[0.12em] uppercase text-petrucci-black group-hover:text-petrucci-gold transition-colors duration-200">
        {category.name}
      </span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        className="text-petrucci-gray group-hover:text-petrucci-gold group-hover:translate-x-0.5 transition-all duration-200"
      >
        <path d="M2 5h6M6 2.5L8.5 5 6 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
