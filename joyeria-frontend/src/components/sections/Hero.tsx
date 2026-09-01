"use client";

/**
 * components/sections/Hero.tsx
 * Hero Banner principal — estilo editorial de lujo (referencia: joyeriaelrubi.com.ar).
 *
 * Características:
 *  - Banner único edge-to-edge a pantalla completa (sin columnas ni particiones).
 *  - Carrusel de imágenes de alta resolución.
 *  - Flechas de navegación `<` y `>` en los laterales.
 *  - Puntos de paginación inferiores (dots).
 *  - Efecto de ZOOM-IN sutil al hacer scroll (scale 1.0 -> 1.08 mediante Framer Motion).
 *  - Cero scroll horizontal (overflow-hidden estricto).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    src: "/banner-1.jpg",
    alt: "Colección Alta Joyería — Petrucci Joyería",
    href: "/joyeria/anillos",
  },
  {
    src: "/banner-2.jpg",
    alt: "Anillos y Joyas Artesanales — Petrucci Joyería",
    href: "/joyeria/cadenas",
  },
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de Framer Motion para el efecto de Zoom-in al hacer scroll
  const { scrollY } = useScroll();
  // De scrollY 0 a 400px -> scale pasa de 1 a 1.08 de forma ultra suave
  const scale = useTransform(scrollY, [0, 400], [1, 1.08]);

  const next = useCallback(() => {
    setDirection(1);
    setActive((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-avance cada 5 segundos si no está en hover
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, paused]);

  const currentSlide = SLIDES[active];

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-100"
      aria-label="Colección destacada Petrucci"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Contenedor de imagen edge-to-edge con zoom al scroll ── */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[2.4/1] max-h-[75vh] overflow-hidden">
        <Link
          href={currentSlide.href}
          className="block relative w-full h-full focus-visible:outline-none"
          tabIndex={0}
          aria-label={currentSlide.alt}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ scale }}
              className="absolute inset-0 w-full h-full origin-center will-change-transform"
            >
              <Image
                src={currentSlide.src}
                alt={currentSlide.alt}
                fill
                priority={active === 0}
                quality={92}
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
        </Link>

        {/* ── Flechas de navegación laterales (< y >) estilo joyeriaelrubi ── */}
        <button
          onClick={prev}
          aria-label="Imagen anterior"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 bg-white/70 hover:bg-white text-petrucci-black shadow-sm flex items-center justify-center transition-all duration-200 focus-visible:outline-none rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={next}
          aria-label="Imagen siguiente"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 bg-white/70 hover:bg-white text-petrucci-black shadow-sm flex items-center justify-center transition-all duration-200 focus-visible:outline-none rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ── Paginación de puntos (Dots) inferiores ── */}
        <div
          className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
          role="tablist"
          aria-label="Selector de slide"
        >
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === active}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => {
                setDirection(idx > active ? 1 : -1);
                setActive(idx);
              }}
              className={`rounded-full transition-all duration-300 focus-visible:outline-none ${
                idx === active
                  ? "w-6 h-1.5 bg-white shadow-sm"
                  : "w-2 h-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
