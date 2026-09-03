"use client";

/**
 * components/sections/Hero.tsx
 * Hero Banner principal — estilo editorial de lujo (referencia: joyeriaelrubi.com.ar).
 *
 * Características:
 *  - Banner interactivo con soporte de arrastre (drag / swipe) tanto en mobile como en desktop.
 *  - Transición fluida entre imágenes con física táctil y de cursor.
 *  - Flechas de navegación `<` y `>` laterales con área táctil cómoda.
 *  - Puntos de paginación inferiores (dots).
 *  - Efecto de ZOOM-IN sutil al hacer scroll (scale 1.0 -> 1.06).
 *  - Auto-avance pausado al interactuar o pasar el mouse por encima.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence, PanInfo } from "framer-motion";

const SLIDES = [
  {
    src: "/banner-1.jpg",
    alt: "Colección Alta Joyería — Petrucci Joyería",
    href: "/joyeria",
  },
  {
    src: "/banner-2.jpg",
    alt: "Anillos y Joyas Artesanales — Petrucci Joyería",
    href: "/joyeria/anillos-2",
  },
  {
    src: "/hero-1.jpg",
    alt: "Relojes de Alta Gama — Marcas Suizas",
    href: "/relojes",
  },
  {
    src: "/hero-2.jpg",
    alt: "Trabajos Personalizados y Alianzas — Petrucci Joyería",
    href: "/trabajos-personalizados",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.3,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0.3,
  }),
};

export default function Hero() {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de Framer Motion para efecto de Zoom-in al hacer scroll
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 400], [1, 1.06]);

  const activeIndex = ((page % SLIDES.length) + SLIDES.length) % SLIDES.length;

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setPage((prevPage) => prevPage + newDirection);
  }, []);

  const goToSlide = (index: number) => {
    const diff = index - activeIndex;
    if (diff === 0) return;
    setDirection(diff > 0 ? 1 : -1);
    setPage((prev) => prev + diff);
  };

  // Auto-avance cada 6 segundos si no está pausado ni arrastrando
  useEffect(() => {
    if (isPaused || isDragging) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
  }, [paginate, isPaused, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 400;

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      paginate(1);
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      paginate(-1);
    }

    // Pequeño timeout para no abrir el link accidentalmente tras soltar el arrastre
    setTimeout(() => {
      setIsDragging(false);
    }, 120);
  };

  const currentSlide = SLIDES[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-900 select-none"
      aria-label="Colección destacada Petrucci"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── Contenedor de imagen edge-to-edge con soporte de arrastre/swipe ── */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[2.4/1] max-h-[75vh] overflow-hidden cursor-grab active:cursor-grabbing">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 280, damping: 32 },
              opacity: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.85}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ scale }}
            className="absolute inset-0 w-full h-full origin-center will-change-transform touch-pan-y"
          >
            <Link
              href={currentSlide.href}
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                }
              }}
              className="block relative w-full h-full focus-visible:outline-none pointer-events-auto"
              tabIndex={0}
              aria-label={currentSlide.alt}
              draggable={false}
            >
              <Image
                src={currentSlide.src}
                alt={currentSlide.alt}
                fill
                priority={activeIndex === 0}
                quality={92}
                sizes="100vw"
                draggable={false}
                className="object-cover object-center pointer-events-none select-none"
              />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* ── Flechas de navegación laterales (< y >) estilo joyeriaelrubi ── */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            paginate(-1);
          }}
          aria-label="Imagen anterior"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 bg-white/75 hover:bg-white text-petrucci-black shadow-md flex items-center justify-center transition-all duration-200 focus-visible:outline-none rounded-full cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            paginate(1);
          }}
          aria-label="Imagen siguiente"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 bg-white/75 hover:bg-white text-petrucci-black shadow-md flex items-center justify-center transition-all duration-200 focus-visible:outline-none rounded-full cursor-pointer"
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
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Slide ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`rounded-full transition-all duration-300 focus-visible:outline-none cursor-pointer ${
                idx === activeIndex
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
