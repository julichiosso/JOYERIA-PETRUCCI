"use client";

/**
 * components/layout/Header.tsx
 * Header de la tienda pública con:
 *  - Barra de anuncios superior rotativos
 *  - Fila principal: buscador en vivo, logo centrado, acceso admin
 *  - Navegación dinámica: construida desde las categorías activas del backend
 *  - Megamenú desplegable para categorías con subrubros
 *  - Búsqueda mobile con dropdown de sugerencias
 */

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import MobileMenuDrawer from "./MobileMenuDrawer";

const ANNOUNCEMENTS = [
  "ATENCIÓN PERSONALIZADA Y AL INSTANTE POR WHATSAPP",
  "GRABADOS PERSONALIZADOS • CONSULTÁ POR WHATSAPP",
  "SAN JORGE, SANTA FE",
  "ABONANDO MEDIANTE TRANSFERENCIA 15% OFF",
  "TALLER PROPIO DE JOYERÍA INTEGRADO"
];

// Links estáticos que siempre aparecen al final de la nav (no son categorías)
const STATIC_NAV_LINKS = [
  { label: "Quiénes Somos", href: "/nosotros" },
  { label: "Contacto", href: "/nosotros#contacto" },
];

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <strong key={i} className="font-bold text-gray-950">{part}</strong>
    ) : (
      <span key={i} className="font-normal text-gray-800">{part}</span>
    )
  );
}

function buildProductUrl(product: Product): string {
  const { slug, category } = product;
  if (category?.parent) {
    return `/${category.parent.slug}/${category.slug}/${slug}`;
  }
  return `/${category?.slug ?? "joyeria"}/${slug}`;
}

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

  // Estados del buscador en vivo
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Categorías raíz activas (sin padre)
  const rootCategories = categories.filter(
    (c) => !c.parent && c.isActive !== false && c.children && c.children.length > 0
      ? true
      : !c.parent && c.isActive !== false
  );

  // Rotación del anuncio cada 4.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sombra sutil al scrollear
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloquear scroll del body cuando el menú mobile esté abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  // Cerrar menú mobile al cambiar de ruta
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Búsqueda en vivo con debounce de 250ms
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.catalog.getProducts({ search: query, limit: 6 });
        const activeItems = res.items.filter((p) => p.status === "ACTIVE");
        setSearchResults(activeItems);
        setDropdownOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Cerrar dropdown al hacer click afuera
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

  const navItemClass = (isActive: boolean) =>
    cn(
      "relative py-3.5 flex items-center gap-1 font-body text-[13px] tracking-normal text-gray-800 hover:text-black transition-colors duration-200 cursor-pointer group whitespace-nowrap",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gray-950 after:transition-transform after:duration-200 after:origin-left",
      isActive
        ? "text-black font-semibold after:scale-x-100"
        : "after:scale-x-0 group-hover:after:scale-x-100"
    );

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-white font-body"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        {/* ── 1. Barra de Anuncios Superior ── */}
        <div className="bg-black text-white overflow-hidden flex items-center justify-center h-8 px-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={announcementIndex}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-center font-body text-[11px] tracking-[0.12em] font-medium uppercase leading-8 px-4 whitespace-nowrap"
              aria-live="polite"
            >
              {ANNOUNCEMENTS[announcementIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── 2. Fila Principal: Buscador | Logo | Admin ── */}
        <div className={cn("bg-white transition-shadow duration-200 border-b border-gray-200", scrolled ? "shadow-xs" : "")}>
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex items-center justify-between h-16 md:h-20 gap-4">

              {/* Izquierda: Hamburguesa (mobile) + Buscador desktop */}
              <div className="flex items-center gap-3 w-1/3" ref={searchContainerRef}>
                <button
                  onClick={() => setMenuOpen(true)}
                  className="md:hidden p-1.5 text-gray-800 hover:text-black transition-colors"
                  aria-label="Abrir menú"
                >
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

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

                {/* Buscador Desktop */}
                <div className="hidden md:block relative w-full max-w-[290px]">
                  <form onSubmit={handleSearchSubmit} role="search" className="relative flex items-center w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim().length >= 2 && searchResults.length > 0) setDropdownOpen(true);
                      }}
                      placeholder="¿Qué estás buscando?"
                      aria-label="Buscar productos"
                      className="w-full h-10 pl-4 pr-11 py-2 bg-white border border-gray-300 rounded-full font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
                      {searchQuery && (
                        <button type="button" onClick={clearSearch} className="text-gray-400 hover:text-gray-700 p-0.5" aria-label="Limpiar búsqueda">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                      <button type="submit" aria-label="Buscar" className="text-gray-500 hover:text-black transition-colors p-0.5 cursor-pointer flex items-center justify-center">
                        {isSearching ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[320px] lg:w-[360px] bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 rounded-xl">
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                        {searchResults.map((product) => {
                          const thumb = product.images?.find((i) => i.order === 0) ?? product.images?.[0];
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductClick(buildProductUrl(product))}
                              className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <div className="relative w-11 h-11 shrink-0 bg-white border border-gray-100 flex items-center justify-center">
                                {thumb && <Image src={getImageUrl(thumb.thumbnailUrl ?? thumb.url)} alt={product.name} fill className="object-contain" sizes="44px" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 line-clamp-1">{highlightMatch(product.name, searchQuery)}</p>
                                {product.showPrice && <p className="text-xs font-semibold text-gray-900">{formatPrice(product.price)}</p>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <Link href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`} onClick={() => setDropdownOpen(false)} className="block p-2.5 bg-gray-50 hover:bg-gray-100 text-center text-xs font-semibold">
                        Ver todos los resultados →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Centro: Logo */}
              <div className="flex justify-center items-center flex-1 md:w-1/3 py-1">
                <Link href="/" className="flex items-center justify-center group" aria-label="Petrucci Joyería — Inicio">
                  <Image
                    src="/logo-petrucci-v2.svg"
                    alt="Petrucci Joyería y Relojería"
                    width={200}
                    height={72}
                    className="h-12 md:h-16 lg:h-[68px] max-h-[72px] w-auto object-contain transition-transform duration-200"
                    priority
                  />
                </Link>
              </div>

              {/* Derecha: WhatsApp (desktop) + Admin */}
              <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3">
                <Link href="/nosotros#contacto" className="hidden lg:inline-flex items-center text-[13px] text-gray-700 hover:text-black font-normal transition-colors">
                  Contacto
                </Link>
                <a
                  href="https://wa.me/5493406419736?text=Hola%20Petrucci,%20quisiera%20hacer%20una%20consulta%20personalizada."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100/80 text-[12px] font-medium tracking-wide transition-all duration-200"
                  aria-label="Atención por WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
                <Link href="/admin/login" className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-black font-normal transition-colors" title="Panel de Administración">
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* ── 3. Fila de Navegación Desktop — DINÁMICA ── */}
          <nav className="hidden md:flex justify-center border-t border-gray-100 bg-white" aria-label="Categorías principales">
            <ul className="flex items-center gap-7 lg:gap-9 font-body text-[13px] font-normal text-gray-800 tracking-normal">
              {rootCategories.map((cat) => {
                const activeChildren = cat.children?.filter((c) => c.isActive !== false) ?? [];
                const hasChildren = activeChildren.length > 0;
                const isActive = pathname.startsWith(`/${cat.slug}`);

                return (
                  <li
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => hasChildren ? setActiveMegaMenu(cat.id) : setActiveMegaMenu(null)}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => setActiveMegaMenu(activeMegaMenu === cat.id ? null : cat.id)}
                        className={navItemClass(isActive || activeMegaMenu === cat.id)}
                      >
                        <span>{cat.name}</span>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400 group-hover:text-black transition-colors">
                          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : (
                      <Link href={`/${cat.slug}`} className={navItemClass(isActive)}>
                        {cat.name}
                      </Link>
                    )}
                  </li>
                );
              })}

              {/* Links estáticos al final */}
              {STATIC_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={navItemClass(pathname === link.href)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Megamenús dinámicos por categoría ── */}
          <AnimatePresence>
            {rootCategories.map((cat) => {
              const activeChildren = cat.children?.filter((c) => c.isActive !== false) ?? [];
              if (!activeMegaMenu || activeMegaMenu !== cat.id || activeChildren.length === 0) return null;

              return (
                <motion.div
                  key={`mega-${cat.id}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50"
                  onMouseEnter={() => setActiveMegaMenu(cat.id)}
                  onMouseLeave={() => setActiveMegaMenu(null)}
                >
                  <div className="mx-auto max-w-7xl px-8 py-8">
                    {/* Link "Ver todo" de la categoría raíz */}
                    <Link
                      href={`/${cat.slug}`}
                      className="inline-block mb-5 font-body text-xs font-semibold tracking-[0.14em] uppercase text-gray-900 hover:underline transition-colors"
                      onClick={() => setActiveMegaMenu(null)}
                    >
                      Ver todo en {cat.name} →
                    </Link>

                    {/* Grid de subcategorías */}
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${Math.min(activeChildren.length, 6)}, minmax(0, 1fr))` }}
                    >
                      {activeChildren.map((sub) => (
                        <div key={sub.id}>
                          <Link
                            href={`/${cat.slug}/${sub.slug}`}
                            className="font-body font-semibold text-xs text-gray-900 tracking-wider uppercase block mb-2 hover:text-black hover:underline transition-colors"
                            onClick={() => setActiveMegaMenu(null)}
                          >
                            {sub.name}
                          </Link>
                          {sub.description && (
                            <p className="font-body text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── 4. Buscador Mobile ── */}
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
                  className="w-full h-10 pl-4 pr-14 py-2 bg-gray-50 border border-gray-300 rounded-full font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  {searchQuery && (
                    <button type="button" onClick={clearSearch} className="text-gray-400 hover:text-gray-700" aria-label="Limpiar búsqueda">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  <button type="submit" aria-label="Buscar" className="text-gray-500 hover:text-black">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Resultados mobile */}
              {dropdownOpen && (
                <div className="mt-2 bg-white border border-gray-200 shadow-xl overflow-hidden divide-y divide-gray-100 rounded-xl">
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
                                  <Image src={getImageUrl(thumb.thumbnailUrl ?? thumb.url)} alt={thumb.altText ?? product.name} fill className="object-contain" sizes="44px" />
                                ) : (
                                  <div className="text-[9px] text-gray-300">Sin foto</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 line-clamp-1">{highlightMatch(product.name, searchQuery)}</p>
                                {product.showPrice && formattedPrice ? (
                                  <p className="text-xs font-semibold text-gray-900 mt-0.5">{formattedPrice}</p>
                                ) : (
                                  <p className="text-[11px] text-gray-800 font-medium mt-0.5">Consultar precio</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <Link
                        href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => { setDropdownOpen(false); setMobileSearchOpen(false); }}
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
      </header>

      {/* ── 5. Menú Mobile Lateral Slide-over ── */}
      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
    </>
  );
}