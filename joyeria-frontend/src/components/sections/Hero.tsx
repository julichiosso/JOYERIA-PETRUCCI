"use client";

/**
 * components/sections/HeroCarousel.tsx
 * Carrusel de imágenes de producto — reemplaza el hero con texto superpuesto.
 *
 * Estética de referencia (joyeriaelrubi.com.ar):
 *  - Imagen grande, sin texto encima — la imagen habla sola
 *  - Dots de paginación abajo
 *  - Fila de 2 miniaturas a la derecha (desktop) o debajo (mobile) mostrando
 *    las próximas fotos — invitan a seguir mirando
 *  - Auto-avance cada 4s, se pausa al hover
 *
 * TODO: Reemplazar /hero-1.jpg, /hero-2.jpg, /hero-3.jpg por fotos reales
 *       de productos de Petrucci. Cada slide puede linkear a una categoría.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  {
    src: "/hero-1.jpg",
    alt: "Anillo solitario oro — Petrucci Joyería",
    href: "/joyeria/anillos",
    label: "Anillos",
  },
  {
    src: "/hero-2.jpg",
    alt: "Cadena y aros oro — Petrucci Joyería",
    href: "/joyeria/cadenas",
    label: "Cadenas & Aros",
  },
  {
    src: "/hero-3.jpg",
    alt: "Reloj clásico acero — Petrucci Joyería",
    href: "/relojes",
    label: "Relojes",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-avance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, paused]);

  const current = SLIDES[active];
  // Las 2 próximas imágenes para los thumbnails
  const previews = [
    SLIDES[(active + 1) % SLIDES.length],
    SLIDES[(active + 2) % SLIDES.length],
  ];

  return (
    <section
      className="w-full"
      aria-label="Galería de productos Petrucci"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Layout: imagen principal + thumbnails en desktop ─────────────── */}
      <div className="flex gap-1.5 md:gap-2">

        {/* Imagen principal */}
        <div className="relative flex-1 min-w-0">
          <Link
            href={current.href}
            className="block relative w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold"
            style={{ aspectRatio: "3/4" }}
            tabIndex={0}
            aria-label={`Ver colección ${current.label}`}
          >
            {SLIDES.map((slide, i) => (
              <Image
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                quality={85}
                className={`object-cover object-center transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 768px) 75vw, 50vw"
              />
            ))}
          </Link>

          {/* Flechas de navegación — solo desktop */}
          <button
            onClick={prev}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm items-center justify-center hover:bg-white transition-colors z-10 focus-visible:outline-none"
            aria-label="Imagen anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm items-center justify-center hover:bg-white transition-colors z-10 focus-visible:outline-none"
            aria-label="Imagen siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Label de la categoría — esquina inferior izquierda */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="font-body text-[10px] tracking-[0.2em] uppercase text-white bg-black/40 backdrop-blur-sm px-2.5 py-1">
              {current.label}
            </span>
          </div>
        </div>

        {/* Thumbnails (próximas 2 imágenes) — solo desktop */}
        <div className="hidden md:flex flex-col gap-2 w-[22%] shrink-0">
          {previews.map((slide) => (
            <button
              key={slide.src}
              onClick={() => setActive(SLIDES.indexOf(slide))}
              className="relative flex-1 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold"
              aria-label={`Ver ${slide.label}`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                quality={65}
                className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                sizes="22vw"
              />
              {/* Overlay sutil al hover */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </button>
          ))}
        </div>

        {/* Thumbnails — mobile: fila debajo (se implementa debajo del div principal) */}
      </div>

      {/* Thumbnails mobile (debajo) */}
      <div className="flex md:hidden gap-1.5 mt-1.5">
        {previews.map((slide) => (
          <button
            key={slide.src}
            onClick={() => setActive(SLIDES.indexOf(slide))}
            className="relative flex-1 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold"
            style={{ aspectRatio: "3/4" }}
            aria-label={`Ver ${slide.label}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              quality={60}
              className="object-cover object-center"
              sizes="33vw"
            />
          </button>
        ))}
      </div>

      {/* Dots de paginación */}
      <div className="flex items-center justify-center gap-2 mt-4" role="tablist" aria-label="Selector de imagen">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Imagen ${i + 1} de ${SLIDES.length}`}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-gold ${
              i === active
                ? "w-6 h-1.5 bg-petrucci-black"
                : "w-1.5 h-1.5 bg-petrucci-border hover:bg-petrucci-gray"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
