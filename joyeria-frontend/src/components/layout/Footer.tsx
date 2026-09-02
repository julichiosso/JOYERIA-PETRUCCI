/**
 * components/layout/Footer.tsx
 * Footer global inspirado en la estructura y elegancia de joyeriaelrubi.com.ar
 *
 * Estructura:
 *  - Columna 1: Newsletter (Novedades y ofertas) + input email + botón suscribirme
 *  - Columna 2: Información (Quiénes somos, Guía de compra, Políticas)
 *  - Columna 3: Contactanos (WhatsApp en formato legible, dirección del local, horarios)
 *  - Redes sociales (Instagram, Facebook) con enlaces directos
 *  - Sin pasarela ni medios de pago transaccionales
 *  - Barra inferior con copyright y ubicación
 */

import Link from "next/link";
import { api } from "@/lib/api";
import NewsletterForm from "./NewsletterForm";

export default async function Footer() {
  let storeConfig = null;
  try {
    storeConfig = await api.catalog.getStoreConfig();
  } catch {
    // Fallbacks si la API no está disponible
  }

  const address = storeConfig?.address ?? "Eva Perón 1574, San Jorge, Santa Fe";
  const businessHours = storeConfig?.businessHours ?? "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00";
  const instagramUrl = storeConfig?.instagramUrl ?? "https://instagram.com/joyeriapetrucci";
  const facebookUrl = storeConfig?.facebookUrl ?? "https://facebook.com/joyeriapetrucci";
  const rawWhatsapp = storeConfig?.whatsappNumber ?? "5493408123456";

  // Formatos legibles para el número de WhatsApp
  const formattedWaIntl = rawWhatsapp.startsWith("54")
    ? `+${rawWhatsapp.slice(0, 2)} ${rawWhatsapp.slice(2, 3)} ${rawWhatsapp.slice(3, 7)} ${rawWhatsapp.slice(7)}`
    : `+${rawWhatsapp}`;
  const formattedWaLocal = rawWhatsapp.includes("3408")
    ? `(03408) ${rawWhatsapp.slice(rawWhatsapp.indexOf("3408") + 4)}`
    : rawWhatsapp;

  return (
    <footer className="w-full border-t border-petrucci-border bg-white text-petrucci-black">
      {/* ── Grid Principal de 3 Columnas ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-18">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 lg:gap-14">

          {/* ── Columna 1: Newsletter ────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-xl md:text-2xl text-petrucci-black tracking-wide font-normal">
              Suscribite al newsletter
            </h3>
            <p className="font-body text-sm text-petrucci-gray leading-relaxed">
              Recibí novedades sobre nuevas piezas, trabajos personalizados y lanzamientos exclusivos antes que nadie.
            </p>
            <div className="mt-2 max-w-sm">
              <NewsletterForm />
            </div>
          </div>

          {/* ── Columna 2: Información ───────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:pl-6">
            <h3 className="font-display text-xl md:text-2xl text-petrucci-black tracking-wide font-normal">
              Información
            </h3>
            <nav aria-label="Enlaces de información">
              <ul className="flex flex-col gap-2.5 font-body text-sm text-petrucci-gray">
                <li>
                  <Link href="/nosotros" className="hover:text-petrucci-gold transition-colors">
                    Quiénes Somos
                  </Link>
                </li>
                <li>
                  <Link href="/trabajos-personalizados" className="hover:text-petrucci-gold transition-colors">
                    Grabados y Trabajos Personalizados
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros#contacto" className="hover:text-petrucci-gold transition-colors">
                    Atención al Cliente y Asesoramiento
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros#envios" className="hover:text-petrucci-gold transition-colors">
                    Envíos y Retiro en Local
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* ── Columna 3: Contactanos ───────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-xl md:text-2xl text-petrucci-black tracking-wide font-normal">
              Contactanos
            </h3>
            <div className="flex flex-col gap-3 font-body text-sm text-petrucci-gray">
              {/* WhatsApp */}
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">WhatsApp y Consultas</p>
                  <a
                    href={`https://wa.me/${rawWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-900 hover:text-amber-800 transition-colors font-medium text-sm mt-0.5"
                  >
                    {formattedWaIntl}
                  </a>
                  {formattedWaLocal !== rawWhatsapp && (
                    <span className="text-xs text-gray-500 block">
                      Local: {formattedWaLocal}
                    </span>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Local y Taller</p>
                  <a
                    href="https://maps.google.com/?q=Eva+Perón+1574,+San+Jorge,+Santa+Fe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-800 transition-colors text-xs leading-relaxed block mt-0.5"
                  >
                    {address}
                  </a>
                </div>
              </div>

              {/* Horarios */}
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 mt-0.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Horarios de atención</p>
                  <p className="text-xs leading-relaxed mt-0.5 text-gray-600">{businessHours}</p>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="flex items-center gap-3 pt-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Petrucci Joyería"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-petrucci-border text-petrucci-gray hover:text-petrucci-black hover:border-petrucci-black transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook de Petrucci Joyería"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-petrucci-border text-petrucci-gray hover:text-petrucci-black hover:border-petrucci-black transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra Inferior Copyright ────────────────────────────────────────── */}
      <div className="border-t border-petrucci-border bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-petrucci-gray font-body">
          <p>© {new Date().getFullYear()} Petrucci Joyería. Todos los derechos reservados.</p>
          <p>San Jorge, Santa Fe, Argentina</p>
        </div>
      </div>
    </footer>
  );
}
