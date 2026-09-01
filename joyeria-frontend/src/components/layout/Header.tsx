"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Mensajes rotativos del announcement bar ──────────────────────────────────
const ANNOUNCEMENTS = [
  "Envíos a todo el país  ·  Gratis a partir de $X",
  "Grabados personalizados · Consultá por WhatsApp",
  "Retiro en local  ·  Eva Perón 1574, San Jorge",
];

const NAV_LINKS = [
  { label: "Anillos", href: "/joyeria/anillos" },
  { label: "Relojes", href: "/relojes" },
  { label: "Cadenas", href: "/joyeria/cadenas" },
  { label: "Personalizados", href: "/personalizados" },
  { label: "Marroquinería", href: "/marroquineria" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

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

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ── 1. Announcement Bar — carrusel rotativo ───────────────────────── */}
      <div
        className="bg-petrucci-black text-petrucci-cream overflow-hidden"
        style={{ height: "2rem" }} // altura fija para evitar layout shift
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

      {/* ── 2. Logo Row ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "bg-petrucci-cream transition-shadow duration-300",
          scrolled ? "shadow-sm" : ""
        )}
      >
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Izquierda — Búsqueda (desktop) / Hamburguesa (mobile) */}
            <div className="flex items-center gap-3 w-1/3">
              {/* Hamburguesa mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1 text-petrucci-black hover:text-petrucci-gold transition-colors"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {/* Búsqueda desktop */}
              <button
                className="hidden md:flex items-center gap-2 text-petrucci-gray hover:text-petrucci-black transition-colors group"
                aria-label="Buscar"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="font-body text-xs tracking-widest uppercase group-hover:text-petrucci-gold transition-colors">
                  Buscar
                </span>
              </button>
            </div>

            {/* Centro — Logo */}
            <div className="flex justify-center w-1/3">
              <Link
                href="/"
                className="font-display text-2xl md:text-3xl tracking-[0.3em] text-petrucci-black hover:text-petrucci-gold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold focus-visible:ring-offset-2"
                aria-label="Petrucci Joyería — Inicio"
              >
                PETRUCCI
              </Link>
            </div>

            {/* Derecha — Íconos */}
            <div className="flex items-center justify-end gap-4 w-1/3">
              <button
                className="hidden md:flex p-1 text-petrucci-gray hover:text-petrucci-black transition-colors"
                aria-label="Mi cuenta"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                className="p-1 text-petrucci-gray hover:text-petrucci-black transition-colors"
                aria-label="Carrito"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3.5 5h11L16 14H2L3.5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M6.5 5V4A2.5 2.5 0 0 1 11.5 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Nav Bar (solo desktop) ───────────────────────────────────── */}
      <div className="hidden md:block bg-petrucci-cream border-t border-b border-petrucci-border">
        <nav className="mx-auto max-w-7xl px-10" aria-label="Categorías">
          <ul className="flex items-center justify-center gap-10 h-11">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-[11px] tracking-[0.15em] uppercase text-petrucci-black hover:text-petrucci-gold transition-colors duration-200 pb-0.5 border-b border-transparent hover:border-petrucci-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── 4. Menú mobile (drawer) ─────────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden bg-petrucci-cream border-b border-petrucci-border overflow-hidden transition-all duration-300 ease-[var(--ease-petrucci)]",
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Navegación mobile">
          <ul className="py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3.5 font-body text-[11px] tracking-[0.15em] uppercase text-petrucci-black hover:text-petrucci-gold hover:pl-8 transition-all duration-200"
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
