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
  whatsappNumber: "5493401417857",
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

      {/* ── Grid Principal de 3 Columnas ──────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">

          {/* ── Columna 1: Newsletter + Redes ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
              SUSCRIBITE A NUESTRO NEWSLETTER
            </h3>
            <NewsletterForm />

            {/* Redes sociales */}
            <div className="flex items-center gap-4 mt-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-gray-900 hover:opacity-75 transition-opacity"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-gray-900 hover:opacity-75 transition-opacity"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* ── Columna 2: Información ───────────────────────────────────────── */}
          <div className="flex flex-col gap-3 md:pl-6">
            <h3 className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
              INFORMACIÓN
            </h3>
            <nav aria-label="Enlaces de información" className="flex flex-col gap-2 text-sm text-gray-700">
              <Link href="/terminos" className="hover:text-black transition-colors">
                Terminos y Condiciones
              </Link>
              <Link href="/nosotros" className="hover:text-black transition-colors">
                Quienes Somos
              </Link>
            </nav>
          </div>

          {/* ── Columna 3: Contactanos ───────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
              CONTACTÁNOS
            </h3>
            <div className="flex flex-col gap-2 text-sm text-gray-700 leading-relaxed">
              <a href={`tel:${rawWhatsapp}`} className="hover:text-black transition-colors block">
                {rawWhatsapp}
              </a>
              <a href={`https://wa.me/${rawWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors block">
                +{rawWhatsapp}
              </a>
              <a href="mailto:contacto@joyeriapetrucci.com.ar" className="hover:text-black transition-colors block">
                contacto@joyeriapetrucci.com.ar
              </a>
              <p className="text-gray-700">{address}</p>
            </div>
          </div>
        </div>

        {/* ── Legales y Copyright ───────────────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-600 leading-relaxed flex flex-col items-center gap-3">
          <p>
            Copyright Petrucci Joyería - 2026. Todos los derechos reservados. Defensa de las y los consumidores. Para reclamos{" "}
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-950 hover:underline">
              ingresá acá.
            </a>{" "}
            /{" "}
            <Link href="/arrepentimiento" className="font-bold text-gray-950 hover:underline">
              Botón de arrepentimiento
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
            <span>Impulsado por</span>
            <div className="flex items-center gap-1 font-bold text-gray-800">
              <svg width="14" height="10" viewBox="0 0 24 16" fill="currentColor">
                <path d="M7 13a5 5 0 0 1-2-9.6A7 7 0 0 1 18 6a4 4 0 0 1 0 7z" />
              </svg>
              <span>WebYa</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
