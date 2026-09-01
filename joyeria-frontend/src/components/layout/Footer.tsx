/**
 * components/layout/Footer.tsx
 * Footer global: marca, navegación, contacto, redes sociales.
 *
 * Server Component — datos de la tienda se obtienen en build/revalidación.
 * No incluye medios de pago transaccionales (sin checkout).
 */

import Link from "next/link";
import { api } from "@/lib/api";
import NewsletterForm from "./NewsletterForm";

const NAV_LINKS = [
  { label: "Anillos", href: "/joyeria/anillos" },
  { label: "Relojes", href: "/relojes" },
  { label: "Cadenas", href: "/joyeria/cadenas" },
  { label: "Personalizados", href: "/personalizados" },
  { label: "Marroquinería", href: "/marroquineria" },
  { label: "Quiénes somos", href: "/nosotros" },
];

export default async function Footer() {
  // Fetch datos públicos de la tienda (con revalidación cada hora)
  let storeConfig = null;
  try {
    storeConfig = await api.catalog.getStoreConfig();
  } catch {
    // Si el backend no responde, mostrar datos de fallback
  }

  const address = storeConfig?.address ?? "Eva Perón 1574, San Jorge, Santa Fe";
  const businessHours = storeConfig?.businessHours ?? "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00";
  const instagramUrl = storeConfig?.instagramUrl ?? "https://instagram.com/joyeriapetrucci";
  const facebookUrl = storeConfig?.facebookUrl ?? null;

  return (
    <footer className="w-full border-t border-petrucci-border bg-petrucci-cream">

      {/* ── Sección principal ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Columna 1: Marca + Redes */}
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              className="font-display text-3xl tracking-[0.35em] text-petrucci-black hover:text-petrucci-gold transition-colors duration-300"
              aria-label="Petrucci Joyería — Inicio"
            >
              PETRUCCI
            </Link>
            <p className="font-body text-sm text-petrucci-gray leading-relaxed max-w-xs">
              Joyas, relojes y trabajos personalizados con más de dos décadas
              de historia en San Jorge, Santa Fe.
            </p>

            {/* Redes sociales */}
            <div className="flex items-center gap-4 mt-1">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Petrucci Joyería"
                  className="text-petrucci-gray hover:text-petrucci-gold transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  className="text-petrucci-gray hover:text-petrucci-gold transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {/* WhatsApp en redes sociales:
                  Se muestra cuando el backend exponga GET /catalog/whatsapp-link.
                  Por ahora se omite para no mostrar un número incorrecto.
              */}
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div className="flex flex-col gap-4">
            <h3 className="font-body text-[10px] tracking-[0.2em] uppercase text-petrucci-gray font-medium">
              Catálogo
            </h3>
            <nav aria-label="Navegación del footer">
              <ul className="flex flex-col gap-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-petrucci-black hover:text-petrucci-gold transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Columna 3: Contacto */}
          <div className="flex flex-col gap-4">
            <h3 className="font-body text-[10px] tracking-[0.2em] uppercase text-petrucci-gray font-medium">
              Contacto
            </h3>
            <address className="not-italic flex flex-col gap-3">
              {/* Dirección */}
              <div className="flex items-start gap-2.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-petrucci-gold">
                  <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <a
                  href="https://maps.google.com/?q=Eva+Perón+1574,+San+Jorge,+Santa+Fe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-petrucci-black hover:text-petrucci-gold transition-colors leading-relaxed"
                >
                  {address}
                </a>
              </div>

              {/* Horarios */}
              <div className="flex items-start gap-2.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-petrucci-gold">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <p className="font-body text-sm text-petrucci-black leading-relaxed">{businessHours}</p>
              </div>
            </address>

            {/* Formas de pago informativas (sin checkout) */}
            <div className="mt-2 pt-4 border-t border-petrucci-border">
              <p className="font-body text-[11px] tracking-wide text-petrucci-gray uppercase mb-2">
                Formas de pago en local
              </p>
              <p className="font-body text-sm text-petrucci-black">
                Efectivo · Transferencia · Tarjetas de débito y crédito
              </p>
            </div>
          </div>
        </div>

        {/* ── Newsletter ─────────────────────────────────────────────────── */}
        <div className="mt-14 pt-10 border-t border-petrucci-border">
          <div className="max-w-md mx-auto md:mx-0 text-center md:text-left">
            <h3 className="font-display text-xl text-petrucci-black mb-1">
              Novedades y ofertas exclusivas
            </h3>
            <p className="font-body text-sm text-petrucci-gray mb-4">
              Suscribite y recibí las últimas incorporaciones al catálogo.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── Copyright ──────────────────────────────────────────────────────── */}
      <div className="border-t border-petrucci-border">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-petrucci-gray">
            © {new Date().getFullYear()} Petrucci Joyería. Todos los derechos reservados.
          </p>
          <p className="font-body text-xs text-petrucci-gray">
            San Jorge, Santa Fe, Argentina
          </p>
        </div>
      </div>

    </footer>
  );
}


