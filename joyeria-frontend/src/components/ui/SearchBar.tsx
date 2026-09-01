"use client";

/**
 * components/ui/SearchBar.tsx
 * Buscador global — se muestra entre el header y el hero en el home.
 *
 * Redirige a /buscar?q=... para la página de resultados.
 * Client Component (necesita el evento onSubmit / router.push).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = "¿Qué estás buscando?",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full border-b border-petrucci-border bg-white">
      <form
        onSubmit={handleSubmit}
        role="search"
        className="mx-auto max-w-7xl px-4 md:px-10 py-2.5"
      >
        <div className="relative flex items-center">
          {/* Ícono lupa */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="absolute left-3.5 text-petrucci-gray pointer-events-none"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Buscar productos"
            className="w-full pl-9 pr-4 py-2 bg-transparent font-body text-sm text-petrucci-black placeholder:text-petrucci-gray focus:outline-none"
          />

          {/* Botón submit — solo visible si hay texto */}
          {query.trim() && (
            <button
              type="submit"
              className="shrink-0 font-body text-xs tracking-[0.12em] uppercase text-petrucci-gold hover:text-petrucci-black transition-colors pr-1"
            >
              Buscar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
