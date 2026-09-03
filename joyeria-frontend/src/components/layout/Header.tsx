"use client";

/**
 * components/layout/Header.tsx
 * Header réplica 1:1 de Joyería El Rubí / Tiendanube:
 *  - Fila superior: Barra de anuncios negra con texto rotativo minimalista (se oculta al scrollear hacia abajo)
 *  - Fila principal: Buscador interactivo en vivo con dropdown de sugerencias y fotos, Logo PETRUCCI centrado, Ingresá/Panel y Carrito a la derecha
 *  - Fila de navegación: Tipografía Inter sans-serif limpia
 *  - Mega Menú desplegable a pantalla completa en hover
 */

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

const ANNOUNCEMENTS = [
  "ENVÍOS A TODO EL PAÍS · ABONANDO MEDIANTE TRANSFERENCIA 10% OFF",
  "GRABADOS PERSONALIZADOS · CONSULTÁ POR WHATSAPP",
  "RETIRO EN LOCAL · SAN JORGE, SANTA FE",
];

// Estructura completa de columnas del Mega Menú (según catálogo Petrucci & referencia El Rubí)
const JOYAS_MEGA_MENU = [
  {
    title: "ANILLOS",
    href: "/joyeria/anillos-2",
    items: [
      { label: "Oro 18K", href: "/joyeria/anillos-2" },
      { label: "Mujer", href: "/joyeria/anillos-2" },
      { label: "Cintillos", href: "/joyeria/anillos-2" },
      { label: "Alianzas", href: "/joyeria/anillos-2" },
      { label: "Hombre", href: "/joyeria/anillos-2" },
      { label: "Con Piedras", href: "/joyeria/anillos-2" },
      { label: "Sin Piedras", href: "/joyeria/anillos-2" },
      { label: "Plata y Oro", href: "/joyeria/anillos-2" },
    ],
  },
  {
    title: "AROS",
    href: "/joyeria/aros",
    items: [
      { label: "Aros de oro", href: "/joyeria/aros" },
      { label: "Abridores", href: "/joyeria/aros" },
      { label: "Cierre Rosca", href: "/joyeria/aros" },
      { label: "Argollitas", href: "/joyeria/aros" },
      { label: "Aros de plata", href: "/joyeria/aros" },
    ],
    secondaryTitle: "DIJES Y COLGANTES",
    secondaryHref: "/joyeria/dijes",
    secondaryItems: [
      { label: "De Oro", href: "/joyeria/dijes" },
      { label: "Cruces", href: "/joyeria/dijes" },
      { label: "De Plata", href: "/joyeria/dijes" },
    ],
  },
  {
    title: "PULSERAS",
    href: "/joyeria/pulseras",
    items: [
      { label: "De Oro", href: "/joyeria/pulseras" },
      { label: "Esclavas", href: "/joyeria/pulseras" },
      { label: "Eslabones", href: "/joyeria/pulseras" },
      { label: "Identidad", href: "/joyeria/pulseras" },
      { label: "De Plata", href: "/joyeria/pulseras" },
    ],
    secondaryTitle: "GARGANTILLAS Y CADENAS",
    secondaryHref: "/joyeria/cadenas",
    secondaryItems: [
      { label: "De Oro", href: "/joyeria/cadenas" },
      { label: "De Plata", href: "/joyeria/cadenas" },
    ],
  },
  {
    title: "HOMBRE",
    href: "/joyeria",
    items: [
      { label: "Anillos", href: "/joyeria/anillos-2" },
      { label: "Cadenas", href: "/joyeria/cadenas" },
      { label: "Llaveros", href: "/marroquineria" },
    ],
    secondaryTitle: "PERSONALIZADOS",
    secondaryHref: "/trabajos-personalizados",
    secondaryItems: [
      { label: "Joyas talladas con nombre", href: "/trabajos-personalizados" },
      { label: "Alianzas grabadas", href: "/trabajos-personalizados" },
      { label: "Diseños a pedido", href: "/trabajos-personalizados" },
    ],
  },
  {
    title: "RELOJES",
    href: "/relojes",
    items: [
      { label: "Victorinox", href: "/relojes" },
      { label: "Tag Heuer", href: "/relojes" },
      { label: "Movado", href: "/relojes" },
      { label: "Tissot", href: "/relojes" },
      { label: "Tommy Hilfiger", href: "/relojes" },
      { label: "Festina", href: "/relojes" },
      { label: "Seiko", href: "/relojes" },
      { label: "Orient", href: "/relojes" },
      { label: "Edox", href: "/relojes" },
    ],
  },
];

const RELOJES_MEGA_MENU = [
  {
    title: "MARCAS SUIZAS & PRESTIGE",
    href: "/relojes",
    items: [
      { label: "Tag Heuer", href: "/relojes" },
      { label: "Movado", href: "/relojes" },
      { label: "Tissot", href: "/relojes" },
      { label: "Victorinox", href: "/relojes" },
      { label: "Edox", href: "/relojes" },
    ],
  },
  {
    title: "CLÁSICOS & JAPÓN",
    href: "/relojes",
    items: [
      { label: "Seiko", href: "/relojes" },
      { label: "Orient", href: "/relojes" },
      { label: "Festina", href: "/relojes" },
    ],
  },
  {
    title: "MODA & TENDENCIA",
    href: "/relojes",
    items: [
      { label: "Tommy Hilfiger", href: "/relojes" },
      { label: "Michael Kors", href: "/relojes" },
      { label: "Gucci", href: "/relojes" },
    ],
  },
];

function buildProductUrl(product: Product): string {
  const { slug, category } = product;
  if (category?.parent) {
    return `/${category.parent.slug}/${category.slug}/${slug}`;
  }
  return `/${category?.slug ?? "joyeria"}/${slug}`;
}

// Resaltar en negrita las partes del texto que coinciden con la búsqueda
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="font-bold text-gray-950">
            {part}
          </strong>
        ) : (
          <span key={i} className="font-normal text-gray-800">
            {part}
          </span>
        )
      )}
    </span>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Control de Mega Menú en desktop
  const [activeMegaMenu, setActiveMegaMenu] = useState<"joyas" | "relojes" | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Ocultar barra al scrollear
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotador de avisos
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Click outside para cerrar dropdown de búsqueda
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda en vivo (Live search con debounce de 200ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.catalog.getProducts({ search: q, limit: 6 });
        setSearchResults(res.items.filter((p) => p.status === "ACTIVE"));
        setDropdownOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setDropdownOpen(false);
    setMobileSearchOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setDropdownOpen(false);
  };

  const handleProductClick = (url: string) => {
    setDropdownOpen(false);
    setMobileSearchOpen(false);
    router.push(url);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white font-body"
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      {/* ── 1. Barra de Anuncios Superior (se esconde al scrollear hacia abajo) ── */}
      <div
        className={cn(
          "bg-black text-white overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out",
          scrolled ? "max-h-0 opacity-0 py-0 pointer-events-none" : "max-h-9 opacity-100 py-1"
        )}
        style={{ height: scrolled ? "0px" : "2.125rem" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!scrolled && (
            <motion.p
              key={announcementIndex}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-center font-body text-[11px] tracking-wide uppercase leading-8 px-4 whitespace-nowrap"
              aria-live="polite"
            >
              {ANNOUNCEMENTS[announcementIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. Fila Principal: Buscador | Logo | Usuario y Carrito ────────── */}
      <div
        className={cn(
          "bg-white transition-shadow duration-200 border-b border-gray-200",
          scrolled ? "shadow-xs" : ""
        )}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">

            {/* Izquierda: Buscador con Dropdown en Vivo (Desktop) */}
            <div className="flex items-center gap-3 w-1/3" ref={searchContainerRef}>
              {/* Botón Menú Mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1.5 text-gray-800 hover:text-black transition-colors"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {menuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {/* Botón Lupa Mobile */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-1.5 text-gray-800 hover:text-black transition-colors"
                aria-label="Abrir buscador"
              >
                <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>

              {/* Formulario Buscador Desktop */}
              <div className="hidden md:block relative w-full max-w-[290px]">
                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                        setDropdownOpen(true);
                      }
                    }}
                    placeholder="¿Qué estás buscando?"
                    aria-label="Buscar productos"
                    className="w-full pl-3 pr-14 py-2 bg-white border border-gray-300 rounded-none font-body text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors shadow-2xs"
                  />

                  <div className="absolute right-2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-700 p-0.5"
                        aria-label="Limpiar búsqueda"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="submit"
                      aria-label="Buscar"
                      className="text-gray-500 hover:text-black transition-colors p-0.5 cursor-pointer"
                    >
                      {isSearching ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>

                {/* ── Dropdown de Resultados en Vivo (Desktop) ─────────────── */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-[320px] lg:w-[360px] bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                          {searchResults.map((product) => {
                            const thumb = product.images?.find((i) => i.order === 0) ?? product.images?.[0];
                            const productUrl = buildProductUrl(product);
                            const formattedPrice = formatPrice(product.price);

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductClick(productUrl)}
                                className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors group cursor-pointer"
                              >
                                {/* Foto de la joya */}
                                <div className="relative w-11 h-11 shrink-0 bg-white border border-gray-100 flex items-center justify-center p-0.5">
                                  {thumb ? (
                                    <Image
                                      src={getImageUrl(thumb.thumbnailUrl ?? thumb.url)}
                                      alt={thumb.altText ?? product.name}
                                      fill
                                      className="object-contain"
                                      sizes="44px"
                                    />
                                  ) : (
                                    <div className="text-[9px] text-gray-300">Sin foto</div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 leading-snug">
                                  <p className="text-xs text-gray-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                                    {highlightMatch(product.name, searchQuery)}
                                  </p>

                                  {product.showPrice && formattedPrice ? (
                                    <div className="mt-0.5">
                                      <p className="text-xs font-semibold text-gray-900">
                                        {formattedPrice}
                                        <span className="text-[11px] font-normal text-gray-500 ml-1">
                                          | 10% OFF transferencia
                                        </span>
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                                      Consultar precio
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Pie del dropdown: Ver todos */}
                        <Link
                          href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                          onClick={() => setDropdownOpen(false)}
                          className="block p-2.5 bg-gray-50 hover:bg-gray-100 text-center text-xs font-semibold text-gray-900 transition-colors"
                        >
                          Ver todos los resultados para &quot;{searchQuery}&quot; →
                        </Link>
                      </>
                    ) : (
                      !isSearching && (
                        <div className="p-4 text-center text-xs text-gray-500">
                          No encontramos productos para &quot;{searchQuery}&quot;
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Centro: Logo Petrucci */}
            <div className="flex justify-center flex-1 md:w-1/3">
              <Link
                href="/"
                className="font-display text-2xl md:text-3xl tracking-[0.22em] text-gray-950 hover:text-amber-800 transition-colors uppercase text-center font-normal"
                aria-label="Petrucci Joyería — Inicio"
              >
                PETRUCCI
              </Link>
            </div>

            {/* Derecha: Ingresá / Carrito */}
            <div className="flex items-center justify-end gap-4 md:gap-6 w-1/3">
              <Link
                href="/admin/login"
                className="hidden md:flex items-center gap-1.5 font-body text-[13px] text-gray-800 hover:text-black transition-colors font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>Ingresá / Registráte</span>
              </Link>

              <Link
                href="#contacto"
                className="flex items-center gap-1.5 font-body text-[13px] text-gray-800 hover:text-black transition-colors font-medium"
                aria-label="Carrito de compras"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path d="M3.5 5h11L16 14H2L3.5 5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M6.5 5V4A2.5 2.5 0 0 1 11.5 4v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Carrito (0)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. Fila de Navegación (Desktop) ─────────────────────────────────── */}
        <nav
          aria-label="Navegación principal de la tienda"
          className="hidden md:flex justify-center border-t border-gray-100 bg-white"
        >
          <ul className="flex items-center gap-8 lg:gap-10 font-body text-[13px] font-normal text-gray-800 tracking-normal">

            {/* Estuches */}
            <li>
              <Link
                href="/estuches"
                className="hover:text-black transition-colors py-3 block"
              >
                Estuches
              </Link>
            </li>

            {/* Joyas (Mega Menú) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveMegaMenu("joyas")}
            >
              <button
                type="button"
                onClick={() => setActiveMegaMenu(activeMegaMenu === "joyas" ? null : "joyas")}
                className={cn(
                  "hover:text-black transition-colors py-3 flex items-center gap-1 cursor-pointer",
                  activeMegaMenu === "joyas" ? "text-black font-medium" : ""
                )}
                aria-expanded={activeMegaMenu === "joyas"}
                aria-haspopup="true"
              >
                <span>Joyas</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>

            {/* Relojes (Mega Menú) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveMegaMenu("relojes")}
            >
              <button
                type="button"
                onClick={() => setActiveMegaMenu(activeMegaMenu === "relojes" ? null : "relojes")}
                className={cn(
                  "hover:text-black transition-colors py-3 flex items-center gap-1 cursor-pointer",
                  activeMegaMenu === "relojes" ? "text-black font-medium" : ""
                )}
                aria-expanded={activeMegaMenu === "relojes"}
                aria-haspopup="true"
              >
                <span>Relojes</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>

            {/* Personalizados */}
            <li>
              <Link
                href="/trabajos-personalizados"
                className="hover:text-black transition-colors py-3 block"
              >
                Personalizados
              </Link>
            </li>

            {/* Contacto */}
            <li>
              <Link
                href="/nosotros#contacto"
                className="hover:text-black transition-colors py-3 block"
              >
                Contacto
              </Link>
            </li>

            {/* Quiénes Somos */}
            <li>
              <Link
                href="/nosotros"
                className="hover:text-black transition-colors py-3 block"
              >
                Quiénes Somos
              </Link>
            </li>

            {/* Marroquinería */}
            <li>
              <Link
                href="/marroquineria"
                className="hover:text-black transition-colors py-3 block"
              >
                Marroquinería
              </Link>
            </li>

            {/* Mates */}
            <li>
              <Link
                href="/mates"
                className="hover:text-black transition-colors py-3 block"
              >
                Mates
              </Link>
            </li>

          </ul>
        </nav>

        {/* ── MEGA MENÚ DESPLEGABLE JOYAS ──────────────────────────────────── */}
        {activeMegaMenu === "joyas" && (
          <div
            className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 animate-fade-in"
            onMouseEnter={() => setActiveMegaMenu("joyas")}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <div className="mx-auto max-w-7xl px-8 py-8">
              <div className="grid grid-cols-5 gap-8">
                {JOYAS_MEGA_MENU.map((col, idx) => (
                  <div key={idx} className="flex flex-col gap-6">
                    <div>
                      <Link
                        href={col.href}
                        className="font-body font-bold text-xs text-gray-900 tracking-wider uppercase block mb-3 hover:text-amber-800 transition-colors"
                      >
                        {col.title}
                      </Link>
                      <ul className="flex flex-col gap-1.5">
                        {col.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <Link
                              href={item.href}
                              className="font-body text-xs text-gray-600 hover:text-black hover:underline transition-colors block py-0.5"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {col.secondaryTitle && col.secondaryItems && (
                      <div className="pt-2 border-t border-gray-100">
                        <Link
                          href={col.secondaryHref ?? "#"}
                          className="font-body font-bold text-xs text-gray-900 tracking-wider uppercase block mb-3 hover:text-amber-800 transition-colors"
                        >
                          {col.secondaryTitle}
                        </Link>
                        <ul className="flex flex-col gap-1.5">
                          {col.secondaryItems.map((sec, secIdx) => (
                            <li key={secIdx}>
                              <Link
                                href={sec.href}
                                className="font-body text-xs text-gray-600 hover:text-black hover:underline transition-colors block py-0.5"
                              >
                                {sec.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEGA MENÚ DESPLEGABLE RELOJES ────────────────────────────────── */}
        {activeMegaMenu === "relojes" && (
          <div
            className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 animate-fade-in"
            onMouseEnter={() => setActiveMegaMenu("relojes")}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <div className="mx-auto max-w-7xl px-8 py-8">
              <div className="grid grid-cols-3 gap-8">
                {RELOJES_MEGA_MENU.map((col, idx) => (
                  <div key={idx}>
                    <Link
                      href={col.href}
                      className="font-body font-bold text-xs text-gray-900 tracking-wider uppercase block mb-3 hover:text-amber-800 transition-colors"
                    >
                      {col.title}
                    </Link>
                    <ul className="flex flex-col gap-1.5">
                      {col.items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          <Link
                            href={item.href}
                            className="font-body text-xs text-gray-600 hover:text-black hover:underline transition-colors block py-0.5"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Mobile Search Bar & Dropdown ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 py-3"
            ref={mobileSearchContainerRef}
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="w-full pl-3.5 pr-14 py-2.5 bg-gray-50 border border-gray-300 rounded-none font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
              />

              <div className="absolute right-3 flex items-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Buscar"
                  className="text-gray-500 hover:text-black"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Resultados en mobile */}
            {dropdownOpen && (
              <div className="mt-2 bg-white border border-gray-200 shadow-xl overflow-hidden divide-y divide-gray-100">
                {searchResults.length > 0 ? (
                  <>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                      {searchResults.map((product) => {
                        const thumb = product.images?.find((i) => i.order === 0) ?? product.images?.[0];
                        const productUrl = buildProductUrl(product);
                        const formattedPrice = formatPrice(product.price);

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductClick(productUrl)}
                            className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <div className="relative w-11 h-11 shrink-0 bg-white border border-gray-100 flex items-center justify-center p-0.5">
                              {thumb ? (
                                <Image
                                  src={getImageUrl(thumb.thumbnailUrl ?? thumb.url)}
                                  alt={thumb.altText ?? product.name}
                                  fill
                                  className="object-contain"
                                  sizes="44px"
                                />
                              ) : (
                                <div className="text-[9px] text-gray-300">Sin foto</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-900 line-clamp-1">
                                {highlightMatch(product.name, searchQuery)}
                              </p>
                              {product.showPrice && formattedPrice ? (
                                <p className="text-xs font-semibold text-gray-900 mt-0.5">
                                  {formattedPrice}
                                </p>
                              ) : (
                                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                                  Consultar precio
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <Link
                      href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileSearchOpen(false);
                      }}
                      className="block p-2.5 bg-gray-50 hover:bg-gray-100 text-center text-xs font-semibold text-gray-900"
                    >
                      Ver todos los resultados →
                    </Link>
                  </>
                ) : (
                  !isSearching && (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No encontramos productos para &quot;{searchQuery}&quot;
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Menú Mobile Drawer ──────────────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out",
          menuOpen ? "max-h-[34rem] opacity-100 py-3" : "max-h-0 opacity-0"
        )}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Navegación mobile">
          <ul className="divide-y divide-gray-100 font-body text-sm font-medium text-gray-800">
            <li className="px-5 py-2.5">
              <span className="font-semibold text-gray-900 block mb-1.5">Joyas</span>
              <ul className="pl-3 space-y-1.5 border-l-2 border-amber-600 font-normal text-xs text-gray-600">
                <li><Link href="/joyeria/anillos-2" onClick={() => setMenuOpen(false)} className="block py-1">Anillos</Link></li>
                <li><Link href="/joyeria/aros" onClick={() => setMenuOpen(false)} className="block py-1">Aros y Aritos</Link></li>
                <li><Link href="/joyeria/cadenas" onClick={() => setMenuOpen(false)} className="block py-1">Cadenas</Link></li>
                <li><Link href="/joyeria/dijes" onClick={() => setMenuOpen(false)} className="block py-1">Dijes</Link></li>
                <li><Link href="/joyeria/pulseras" onClick={() => setMenuOpen(false)} className="block py-1">Pulseras</Link></li>
                <li><Link href="/trabajos-personalizados" onClick={() => setMenuOpen(false)} className="block py-1">Trabajos Personalizados</Link></li>
              </ul>
            </li>

            <li className="px-5 py-3">
              <Link href="/relojes" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Relojes
              </Link>
            </li>
            <li className="px-5 py-3">
              <Link href="/trabajos-personalizados" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Personalizados
              </Link>
            </li>
            <li className="px-5 py-3">
              <Link href="/marroquineria" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Marroquinería
              </Link>
            </li>
            <li className="px-5 py-3">
              <Link href="/mates" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Mates
              </Link>
            </li>
            <li className="px-5 py-3">
              <Link href="/nosotros" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Quiénes Somos
              </Link>
            </li>
            <li className="px-5 py-3">
              <Link href="/nosotros#contacto" onClick={() => setMenuOpen(false)} className="block hover:text-black">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
