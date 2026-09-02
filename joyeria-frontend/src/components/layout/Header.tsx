"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Mensajes rotativos del announcement bar ──────────────────────────────────
const ANNOUNCEMENTS = [
  "ENVÍOS A TODO EL PAÍS · ABONANDO MEDIANTE TRANSFERENCIA 10% OFF",
  "GRABADOS PERSONALIZADOS · CONSULTÁ POR WHATSAPP",
  "RETIRO EN LOCAL · SAN JORGE, SANTA FE",
];

const NAV_LINKS = [
  { label: "Anillos", href: "/joyeria/anillos-2" },
  { label: "Relojes", href: "/relojes" },
  { label: "Cadenas", href: "/joyeria/cadenas" },
  { label: "Personalizados", href: "/trabajos-personalizados" },
  { label: "Marroquinería", href: "/marroquineria" },
  { label: "Mates", href: "/mates" },
  { label: "Quiénes Somos", href: "/nosotros" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const router = useRouter();

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Carrusel rotativo — cambia cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
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

      {/* ── 1. Announcement Bar — carrusel rotativo ───────────────────────── */}
      <div
        className="bg-petrucci-black text-petrucci-cream overflow-hidden"
        style={{ height: "2rem" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={announcementIndex}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-center font-body text-[10px] tracking-[0.2em] uppercase leading-8 px-4 whitespace-nowrap"
            aria-live="polite"
          >
            {ANNOUNCEMENTS[announcementIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── 2. Header Main Row (Buscador a la izquierda, Logo al centro, Acciones a la derecha) ─ */}
      <div
        className={cn(
          "bg-white transition-shadow duration-300 border-b border-petrucci-border",
          scrolled ? "shadow-sm" : ""
        )}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">

            {/* ── Izquierda: Buscador integrado en Desktop / Hamburguesa en Mobile ── */}
            <div className="flex items-center gap-3 w-1/3">
              {/* Botón hamburguesa mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1 text-petrucci-black hover:text-petrucci-gold transition-colors"
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
                className="md:hidden p-1 text-petrucci-black hover:text-petrucci-gold transition-colors"
                aria-label="Abrir buscador"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>

              {/* Buscador Desktop integrado en la barra (estilo joyeriaelrubi.com.ar) */}
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="hidden md:flex items-center relative w-full max-w-[260px]"
              >
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  aria-label="Buscar productos"
                  className="w-full pl-3.5 pr-9 py-2 bg-white border border-gray-300 rounded-sm font-body text-xs text-petrucci-black placeholder:text-gray-400 focus:outline-none focus:border-petrucci-black transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Buscar"
                  className="absolute right-2.5 text-gray-500 hover:text-petrucci-black transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </div>

            {/* ── Centro: Logo Petrucci ── */}
            <div className="flex justify-center flex-1 md:w-1/3">
              <Link
                href="/"
                className="font-display text-2xl md:text-3xl tracking-[0.25em] text-petrucci-black hover:text-petrucci-gold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold focus-visible:ring-offset-2 uppercase text-center font-normal"
                aria-label="Petrucci Joyería — Inicio"
              >
                PETRUCCI
              </Link>
            </div>

            {/* ── Derecha: Ingresá / Carrito ── */}
            <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3">
              <Link
                href="/admin/login"
                className="hidden md:flex items-center gap-1.5 font-body text-xs text-petrucci-black hover:text-petrucci-gold transition-colors tracking-wide"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>Ingresá</span>
              </Link>

              <Link
                href="#contacto"
                className="flex items-center gap-1.5 font-body text-xs text-petrucci-black hover:text-petrucci-gold transition-colors"
                aria-label="Carrito de compras"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3.5 5h11L16 14H2L3.5 5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M6.5 5V4A2.5 2.5 0 0 1 11.5 4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="hidden md:inline text-xs tracking-wide">Carrito (0)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Categorías (solo Desktop, centrada, estilo minimalista) ── */}
      <div className="hidden md:block bg-white border-b border-petrucci-border">
        <nav className="mx-auto max-w-7xl px-8" aria-label="Categorías">
          <ul className="flex items-center justify-center gap-8 h-10">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-[11px] tracking-[0.14em] uppercase text-gray-700 hover:text-petrucci-gold transition-colors duration-200 pb-0.5 border-b border-transparent hover:border-petrucci-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── 4. Mobile Search Dropdown (cuando se toca la lupa en mobile) ── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-petrucci-border px-4 py-3"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-sm font-body text-sm text-petrucci-black placeholder:text-gray-400 focus:outline-none focus:border-petrucci-black"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-3 text-gray-500 hover:text-petrucci-black"
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

      {/* ── 5. Menú mobile drawer ── */}
      <div
        className={cn(
          "md:hidden bg-white border-b border-petrucci-border overflow-hidden transition-all duration-300 ease-[var(--ease-petrucci)]",
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Navegación mobile">
          <ul className="py-2 divide-y divide-gray-100">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 font-body text-xs tracking-[0.15em] uppercase text-petrucci-black hover:text-petrucci-gold hover:pl-8 transition-all duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

    </header>
  );
}
