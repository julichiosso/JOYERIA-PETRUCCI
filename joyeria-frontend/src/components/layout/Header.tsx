"use client";

/**
 * components/layout/Header.tsx
 * Header réplica 1:1 de Joyería El Rubí / Tiendanube:
 *  - Fila superior: Barra de anuncios negra con texto rotativo minimalista
 *  - Fila principal: Buscador a la izquierda, Logo PETRUCCI centrado, Ingresá/Panel y Carrito a la derecha
 *  - Fila de navegación: Tipografía Inter sans-serif limpia
 *  - Mega Menú desplegable a pantalla completa en hover (idéntico a la referencia de El Rubí)
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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Control de Mega Menú en desktop
  const [activeMegaMenu, setActiveMegaMenu] = useState<"joyas" | "relojes" | null>(null);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

            {/* Izquierda: Buscador */}
            <div className="flex items-center gap-3 w-1/3">
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

              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="hidden md:flex items-center relative w-full max-w-[280px]"
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
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
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
                <span className="hidden md:inline">Carrito (0)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Navegación (Estilo Tiendanube / El Rubí) ────────────── */}
      <div className="hidden md:block bg-white border-b border-gray-200 relative">
        <nav className="mx-auto max-w-7xl px-8" aria-label="Navegación principal">
          <ul className="flex items-center justify-center gap-8 h-11 text-[13.5px] font-body text-gray-800">

            {/* Estuches */}
            <li>
              <Link
                href="/marroquineria"
                className="hover:text-black transition-colors py-3 block"
              >
                Estuches
              </Link>
            </li>

            {/* Joyas (Abre Mega Menú) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveMegaMenu("joyas")}
            >
              <Link
                href="/joyeria"
                className={cn(
                  "inline-flex items-center gap-1 py-3 transition-colors border-b-2",
                  activeMegaMenu === "joyas"
                    ? "border-black text-black font-semibold"
                    : "border-transparent text-gray-800 hover:text-black"
                )}
              >
                <span>Joyas</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                  <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>

            {/* Relojes (Abre Mega Menú) */}
            <li
              className="relative"
              onMouseEnter={() => setActiveMegaMenu("relojes")}
            >
              <Link
                href="/relojes"
                className={cn(
                  "inline-flex items-center gap-1 py-3 transition-colors border-b-2",
                  activeMegaMenu === "relojes"
                    ? "border-black text-black font-semibold"
                    : "border-transparent text-gray-800 hover:text-black"
                )}
              >
                <span>Relojes</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                  <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
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

        {/* ── MEGA MENÚ DESPLEGABLE JOYAS (Idéntico a Image 2 de El Rubí) ──── */}
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

        {/* ── MEGA MENÚ DESPLEGABLE RELOJES ──────────────────────────────────── */}
        {activeMegaMenu === "relojes" && (
          <div
            className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 animate-fade-in"
            onMouseEnter={() => setActiveMegaMenu("relojes")}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <div className="mx-auto max-w-7xl px-8 py-8">
              <div className="grid grid-cols-3 gap-12 max-w-4xl">
                {RELOJES_MEGA_MENU.map((col, idx) => (
                  <div key={idx} className="flex flex-col">
                    <p className="font-body font-bold text-xs text-gray-900 tracking-wider uppercase mb-3">
                      {col.title}
                    </p>
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
