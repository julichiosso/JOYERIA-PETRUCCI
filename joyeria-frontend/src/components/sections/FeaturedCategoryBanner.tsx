"use client";

/**
 * src/components/sections/FeaturedCategoryBanner.tsx
 * Banner editorial de categoría destacada (full-bleed, alta gama).
 *
 * Inspirado en la jerarquía y estructura visual de Joyería El Rubí:
 * - Fotografía hero de fondo con encuadre inmersivo.
 * - Overlay con gradiente direccional para garantizar legibilidad del texto sin oscurecer toda la imagen.
 * - Kicker superior en sans-serif con tracking amplio (idéntico al estilo de "NOVEDADES").
 * - Título principal en Cormorant Garamond itálica de gran escala.
 * - Bajada editorial sutil y botón CTA con área táctil >= 44px y peso font-medium.
 * - Totalmente responsive (desktop 60-70vh, mobile proporción cuidada con legibilidad perfecta).
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export interface FeaturedCategoryBannerProps {
  /** Kicker superior en mayúsculas (ej: "TRABAJOS PERSONALIZADOS") */
  kicker?: string;
  /** Título principal en Cormorant itálica (ej: "Piezas con tu nombre") */
  title?: string;
  /** Bajada o subtítulo descriptivo */
  subtitle?: string;
  /** Texto del botón CTA */
  ctaText?: string;
  /** URL de destino del botón CTA */
  ctaHref?: string;
  /** Imagen de fondo */
  imageUrl?: string;
  /** Texto alternativo para accesibilidad y SEO */
  imageAlt?: string;
  /** Alineación del bloque de contenido */
  align?: "left" | "right" | "center";
  /** Clases CSS adicionales */
  className?: string;
}

export default function FeaturedCategoryBanner({
  kicker = "TRABAJOS PERSONALIZADOS",
  title = "Piezas con tu nombre",
  subtitle = "Diseños únicos forjados a mano en oro y plata. Grabados, alianzas y piezas que cuentan tu propia historia.",
  ctaText = "Consultar un diseño",
  ctaHref = "/trabajos-personalizados",
  imageUrl = "/hero-2.jpg",
  imageAlt = "Trabajos personalizados y alianzas exclusivas — Petrucci Joyería",
  align = "right",
  className = "",
}: FeaturedCategoryBannerProps) {
  // Gradiente direccional según alineación
  const gradientClasses =
    align === "right"
      ? "bg-gradient-to-t from-black/90 via-black/50 to-transparent md:bg-gradient-to-l md:from-black/85 md:via-black/45 md:to-transparent"
      : align === "left"
      ? "bg-gradient-to-t from-black/90 via-black/50 to-transparent md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-transparent"
      : "bg-black/50 md:bg-black/40";

  const contentAlignClasses =
    align === "right"
      ? "md:ml-auto md:text-right items-start md:items-end"
      : align === "left"
      ? "md:mr-auto md:text-left items-start md:items-start"
      : "mx-auto text-center items-center";

  return (
    <section
      className={`relative w-full overflow-hidden bg-black min-h-[420px] sm:min-h-[480px] md:h-[65vh] md:max-h-[620px] flex items-center ${className}`}
      aria-label={`${kicker}: ${title}`}
    >
      {/* ── Imagen de Fondo Full-Bleed ────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority={false}
          quality={85}
          sizes="100vw"
          className="object-cover object-center scale-[1.02] transition-transform duration-700 ease-out"
        />
        {/* Capa de gradiente direccional sutil para legibilidad impecable */}
        <div className={`absolute inset-0 z-1 ${gradientClasses}`} />
      </div>

      {/* ── Contenido Superpuesto ────────────────────────────────────────── */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 py-12 md:py-16">
        <div className={`flex flex-col max-w-xl lg:max-w-2xl ${contentAlignClasses}`}>
          
          {/* Kicker Superior */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-white/85 uppercase mb-3 sm:mb-4"
          >
            {kicker}
          </motion.p>

          {/* Título Principal en Cormorant Garamond Itálica */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="font-serif italic font-light text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] text-white leading-[1.12] tracking-tight mb-3 sm:mb-5"
          >
            {title}
          </motion.h2>

          {/* Subtítulo / Descripción */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="font-sans text-xs sm:text-sm text-white/80 font-normal leading-relaxed mb-6 sm:mb-8 max-w-lg"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Botón de Llamada a la Acción (CTA) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 sm:px-8 py-3 bg-white text-gray-950 hover:bg-[#F5F5F7] text-xs font-medium tracking-[0.18em] uppercase transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <span>{ctaText}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path
                  d="M6 3.5L10.5 8L6 12.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
