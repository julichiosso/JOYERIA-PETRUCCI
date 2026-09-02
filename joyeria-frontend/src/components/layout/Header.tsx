"use client";

/**
 * components/layout/Header.tsx
 * Header réplica fiel del estilo Tiendanube / Joyería El Rubí:
 *  - Fila superior: Barra de anuncios negra con texto rotativo minimalista
 *  - Fila principal: Buscador a la izquierda ("¿Qué estás buscando?"), Logo PETRUCCI centrado, "Ingresá" y "Carrito" a la derecha
 *  - Fila de navegación: Tipografía limpia (Inter sans-serif), dropdown mega-menú en "Joyas" y "Relojes", estilo 100% Tiendanube
 */

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ANNOUNCEMENTS = [
  "ENVÍOS A TODO EL PAÍS · ABONANDO MEDIANTE TRANSFERENCIA 10% OFF",
  "GRABADOS PERSONALIZADOS · CONSULTÁ POR WHATSAPP",
  "RETIRO EN LOCAL · SAN JORGE, SANTA FE",
];

// Estructura de categorías según el negocio real de Petrucci
const JOYAS_SUBCATEGORIES = [
  { label: "Anillos", href: "/joyeria/anillos-2" },
  { label: "Dijes", href: "/joyeria/dijes" },
  { label: "Cadenas", href: "/joyeria/cadenas" },
  { label: "Aros y Aritos", href: "/joyeria/aros" },
  { label: "Pulseras", href: "/joyeria/pulseras" },
  { label: "Trabajos Personalizados", href: "/trabajos-personalizados" },
];

const RELOJES_MARCAS = [
  { label: "Seiko", href: "/relojes/seiko" },
  { label: "Movado", href: "/relojes/movado" },
  { label: "Tag Heuer", href: "/relojes/tag-heuer" },
  { label: "Tissot", href: "/relojes/tissot" },
  { label: "Tommy Hilfiger", href: "/relojes/tommy-hilfiger" },
  { label: "Orient", href: "/relojes/orient" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Estados de dropdown desktop
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const router = useRouter();

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Carrusel rotativo de anuncios
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white">

      {/* ── 1. Barra de Anuncios Superior ──────────────────────────────────── */}
      <div
        className="bg-black text-white overflow-hidden flex items-center justify-center"
        style={{ height: "2.125rem" }}
      >
        <AnimatePresence mode="wait" initial={false}>
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
        </AnimatePresence>
      </div>

      {/* ── 2. Fila Principal: Buscador | Logo | Usuario y Carrito ────────── */}
      <div
        className={cn(
          "bg-white transition-shadow duration-200 border-b border-gray-200",
          scrolled ? "shadow-sm" : ""
        )}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">

            {/* ── Izquierda: Buscador (Desktop) / Hamburguesa + Lupa (Mobile) ─ */}
            <div className="flex items-center gap-3 w-1/3">
              {/* Botón hamburguesa mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1.5 text-gray-800 hover:text-black transition-colors"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {/* Botón lupa mobile */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-1.5 text-gray-800 hover:text-black transition-colors"
                aria-label="Abrir buscador"
              >
                <svg width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>

              {/* Buscador Desktop (idéntico a Tiendanube / El Rubí) */}
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="hidden md:flex items-center relative w-full max-w-[270px]"
              >
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  aria-label="Buscar productos"
                  className="w-full pl-3.5 pr-9 py-2 bg-white border border-gray-300 rounded-sm font-body text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Buscar"
                  className="absolute right-2.5 text-gray-400 hover:text-black transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </div>

            {/* ── Centro: Logo Petrucci ── */}
            <div className="flex justify-center flex-1 md:w-1/3">
              <Link
                href="/"
                className="font-display text-2xl md:text-3xl tracking-[0.22em] text-gray-950 hover:text-amber-800 transition-colors uppercase text-center font-normal"
                aria-label="Petrucci Joyería — Inicio"
              >
                PETRUCCI
              </Link>
            </div>

            {/* ── Derecha: Ingresá / Carrito ── */}
            <div className="flex items-center justify-end gap-4 md:gap-6 w-1/3">
              <Link
                href="/admin/login"
                className="hidden md:flex items-center gap-1.5 font-body text-[13px] text-gray-800 hover:text-black transition-colors font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>Ingresá / Panel</span>
              </Link>

              <Link
                href="#contacto"
                className="flex items-center gap-1.5 font-body text-[13px] text-gray-800 hover:text-black transition-colors font-medium"
                aria-label="Carrito de compras"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3.5 5h11L16 14H2L3.5 5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M6.5 5V4A2.5 2.5 0 0 1 11.5 4v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="hidden md:inline">Carrito (0)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Navegación con Mega Menú (Estilo Tiendanube / El Rubí) ── */}
      <div className="hidden md:block bg-white border-b border-gray-200 relative">
        <nav className="mx-auto max-w-7xl px-8" aria-label="Navegación principal">
          <ul className="flex items-center justify-center gap-8 h-11">

            {/* Item 1: Joyas (con Mega Menú) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveDropdown("joyas")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href="/joyeria"
                className="inline-flex items-center gap-1 font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black"
              >
                <span>Joyas</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                  <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Dropdown Joyas */}
              {activeDropdown === "joyas" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 shadow-xl rounded-b-md p-3 z-50">
                  <ul className="flex flex-col gap-1">
                    {JOYAS_SUBCATEGORIES.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className="block px-3 py-2 text-[13px] font-body text-gray-700 hover:text-black hover:bg-gray-50 rounded transition-colors font-medium"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {/* Item 2: Relojes (con Dropdown Marcas) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveDropdown("relojes")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href="/relojes"
                className="inline-flex items-center gap-1 font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black"
              >
                <span>Relojes</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                  <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Dropdown Relojes */}
              {activeDropdown === "relojes" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 shadow-xl rounded-b-md p-3 z-50">
                  <p className="px-3 py-1 text-[11px] font-body font-semibold text-gray-400 uppercase tracking-wider">
                    Marcas Destacadas
                  </p>
                  <ul className="flex flex-col gap-1 mt-1">
                    {RELOJES_MARCAS.map((marca) => (
                      <li key={marca.href}>
                        <Link
                          href={marca.href}
                          className="block px-3 py-2 text-[13px] font-body text-gray-700 hover:text-black hover:bg-gray-50 rounded transition-colors font-medium"
                        >
                          {marca.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {/* Item 3: Personalizados */}
            <li>
              <Link
                href="/trabajos-personalizados"
                className="font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black block"
              >
                Personalizados
              </Link>
            </li>

            {/* Item 4: Marroquinería */}
            <li>
              <Link
                href="/marroquineria"
                className="font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black block"
              >
                Marroquinería
              </Link>
            </li>

            {/* Item 5: Mates */}
            <li>
              <Link
                href="/mates"
                className="font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black block"
              >
                Mates
              </Link>
            </li>

            {/* Item 6: Quiénes Somos */}
            <li>
              <Link
                href="/nosotros"
                className="font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black block"
              >
                Quiénes Somos
              </Link>
            </li>

            {/* Item 7: Contacto */}
            <li>
              <Link
                href="/nosotros#contacto"
                className="font-body text-[13.5px] text-gray-800 hover:text-black transition-colors font-medium py-3 border-b-2 border-transparent hover:border-black block"
              >
                Contacto
              </Link>
            </li>

          </ul>
        </nav>
      </div>

      {/* ── 4. Mobile Search Dropdown ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 py-3"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-sm font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-3 text-gray-500 hover:text-black"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Menú Mobile Drawer ──────────────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out",
          menuOpen ? "max-h-[32rem] opacity-100 py-3" : "max-h-0 opacity-0"
        )}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Navegación mobile">
          <ul className="divide-y divide-gray-100 font-body text-sm font-medium text-gray-800">
            {/* Joyas mobile con subitems */}
            <li className="px-5 py-2.5">
              <span className="font-semibold text-gray-900 block mb-1.5">Joyas</span>
              <ul className="pl-3 space-y-1.5 border-l-2 border-amber-600 font-normal text-xs text-gray-600">
                {JOYAS_SUBCATEGORIES.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} onClick={() => setMenuOpen(false)} className="block py-1 hover:text-black">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Relojes mobile con marcas */}
            <li className="px-5 py-2.5">
              <span className="font-semibold text-gray-900 block mb-1.5">Relojes</span>
              <ul className="pl-3 space-y-1.5 border-l-2 border-amber-600 font-normal text-xs text-gray-600">
                {RELOJES_MARCAS.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} onClick={() => setMenuOpen(false)} className="block py-1 hover:text-black">
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
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
