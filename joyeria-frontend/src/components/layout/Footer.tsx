"use client";

/**
 * components/layout/Footer.tsx
 * Footer idéntico al diseño de referencia (joyeriaelrubi / tiendanube):
 *  - 3 Columnas: Newsletter + Redes | Información | Contactanos
 *  - Fila de 18 medios de pago y tarjetas argentinas
 *  - Leyenda legal de Defensa del Consumidor, botón de arrepentimiento y copyright
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PublicStoreConfig } from "@/types/store-config";
import NewsletterForm from "./NewsletterForm";
import PaymentMarquee from "./PaymentMarquee";

const DEFAULT_CONFIG: PublicStoreConfig = {
  storeName: "Petrucci Joyería",
  address: "Eva perón 1574 San Jorge, Santa Fe",
  businessHours: "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00",
  instagramUrl: "https://www.instagram.com/joyeriapetrucci/",
  facebookUrl: null,
  whatsappNumber: "5493406642761",
  returnPolicy: null,
  shippingInfo: null,
};

export default function Footer() {
  const [config, setConfig] = useState<PublicStoreConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;
    api.catalog
      .getStoreConfig()
      .then((data) => {
        if (mounted && data) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const address = config.address ?? DEFAULT_CONFIG.address!;
  const instagramUrl = config.instagramUrl ?? DEFAULT_CONFIG.instagramUrl;
  const facebookUrl = config.facebookUrl ?? DEFAULT_CONFIG.facebookUrl;
  const rawWhatsapp = config.whatsappNumber ?? DEFAULT_CONFIG.whatsappNumber!;

  return (
    <footer className="w-full border-t border-gray-200 bg-white text-gray-800 font-sans">
      {/* ── Marquesina animada de medios de pago en el tope ──────────────── */}
      <PaymentMarquee />

      {/* ── Grid Principal de 4 Columnas Editoriales ─────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Columna 1: Atelier & Manufactura (Newsletter VIP) ──────────── */}
          <div className="flex flex-col gap-4">
            
            <p className="text-xs text-gray-600 leading-relaxed font-body">
              Recibí y enterate de lanzamientos de partidas limitadas, nuevas creaciones, ingresos y beneficios exclusivos en tu casilla.
            </p>
            <NewsletterForm />
          </div>

          {/* ── Columna 2: Asesoramiento Directo ───────────────────────────── */}
          <div className="flex flex-col gap-3 lg:pl-4">
            <div className="flex flex-col gap-2.5 text-xs text-gray-600 font-body leading-relaxed">
              <a
                href={`https://wa.me/${rawWhatsapp.replace(/\D/g, "")}?text=Hola%20Petrucci,%20quisiera%20hacer%20una%20consulta%20personalizada.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-800 font-semibold hover:text-emerald-950 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                WhatsApp: +{rawWhatsapp}
              </a>
              <p className="text-gray-600">
                Atención personalizada de lunes a sábado de 9 a 18 hs.
              </p>
              <a href="mailto:victorpetrucci84@gmail.com" className="hover:text-black transition-colors block">
                victorpetrucci84@gmail.com
              </a>
              <p className="text-gray-500 pt-1">{address}</p>
            </div>
          </div>

          {/* ── Columna 3: Compromiso Petrucci ─────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:pl-4">
            <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 tracking-[0.2em] uppercase font-body">
              COMPROMISO PETRUCCI
            </h3>
            <nav aria-label="Compromiso y manufactura" className="flex flex-col gap-2 text-xs text-gray-600 font-body">
              <Link href="/nosotros" className="hover:text-black transition-colors">
                Quiénes Somos &amp; Origen
              </Link>
              <Link href="/trabajos-personalizados" className="hover:text-black transition-colors">
                Piezas y Trabajos a Medida
              </Link>
              <Link href="/nosotros#contacto" className="hover:text-black transition-colors">
                Visita al Atelier &amp; Cita Previa
              </Link>
              <Link href="/joyeria" className="hover:text-black transition-colors">
                Alta Joyería &amp; Metales Nobles
              </Link>
            </nav>
          </div>

          {/* ── Columna 4: Sanctuary Legal ─────────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:pl-4">
            <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 tracking-[0.2em] uppercase font-body">
              INFORMACIÓN &amp; LEGALES
            </h3>
            <nav aria-label="Enlaces legales y términos" className="flex flex-col gap-2 text-xs text-gray-600 font-body">
              <Link href="/terminos" className="hover:text-black transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="/arrepentimiento" className="hover:text-black transition-colors">
                Botón de Arrepentimiento
              </Link>
              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Defensa de las y los Consumidores
              </a>
              <span className="text-gray-500 text-[11px] pt-1">
                Garantía y trazabilidad en cada pieza
              </span>
            </nav>
          </div>
        </div>

        {/* ── Legales y Copyright ───────────────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-500 leading-relaxed flex flex-col items-center gap-3">
          <p className="font-body">
            Copyright © 2026 Petrucci Joyería y Marroquinería •  San Jorge. Todos los derechos reservados.
          </p>

          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
            <span>Impulsado por</span>
            <a
              href="https://webya-landing.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold text-gray-800 hover:text-black transition-colors"
            >
              <svg width="14" height="10" viewBox="0 0 24 16" fill="currentColor">
                <path d="M7 13a5 5 0 0 1-2-9.6A7 7 0 0 1 18 6a4 4 0 0 1 0 7z" />
              </svg>
              <span>WebYa</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
