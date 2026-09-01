/**
 * app/nosotros/page.tsx
 * Página "Quiénes somos" / Contacto
 */

import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Quiénes somos — Petrucci Joyería",
  description:
    "Conocé la historia de Petrucci Joyería, más de 25 años en San Jorge, Santa Fe. Joyas, relojes y trabajos personalizados con atención personalizada.",
};

export default async function NosotrosPage() {
  let storeConfig = null;
  try {
    storeConfig = await api.catalog.getStoreConfig();
  } catch {
    // fallback
  }

  const address = storeConfig?.address ?? "Eva Perón 1574, San Jorge, Santa Fe";
  const businessHours = storeConfig?.businessHours ?? "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00";
  const instagramUrl = storeConfig?.instagramUrl ?? "https://instagram.com/joyeriapetrucci";

  return (
    <>
      {/* ── Hero de sección ──────────────────────────────────────────────── */}
      <div className="border-b border-petrucci-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-20">
          <nav aria-label="Migas de pan" className="mb-5">
            <ol className="flex items-center gap-1.5 font-body text-xs text-petrucci-gray">
              <li><Link href="/" className="hover:text-petrucci-gold transition-colors">Inicio</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-petrucci-black" aria-current="page">Quiénes somos</li>
            </ol>
          </nav>
          <h1 className="font-display text-4xl md:text-6xl text-petrucci-black max-w-2xl">
            Más de 25 años haciendo joyas con historia
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20">

          {/* ── Historia ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-2xl md:text-3xl text-petrucci-black">
              Nuestra historia
            </h2>
            <div className="flex flex-col gap-4 font-body text-sm text-petrucci-gray leading-relaxed">
              <p>
                Petrucci Joyería nació en San Jorge, Santa Fe, con el mismo propósito que
                nos mueve hoy: crear piezas únicas que acompañen los momentos más importantes
                de la vida de las personas.
              </p>
              <p>
                A lo largo de los años fuimos incorporando relojes de las mejores marcas,
                marroquinería seleccionada, mates artesanales y un servicio de grabados
                y trabajos personalizados que se convirtió en uno de los más elegidos de
                la región.
              </p>
              <p>
                Cada pieza que sale de nuestro local lleva consigo la dedicación y el cuidado
                de un equipo que ama lo que hace.
              </p>
            </div>

            {/* Pilares */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { number: "25+", label: "Años de trayectoria" },
                { number: "100%", label: "Atención personalizada" },
                { number: "∞", label: "Piezas únicas" },
                { number: "🤝", label: "Confianza garantizada" },
              ].map((item) => (
                <div key={item.label} className="border border-petrucci-border p-4">
                  <p className="font-display text-3xl text-petrucci-gold mb-1">{item.number}</p>
                  <p className="font-body text-xs text-petrucci-gray">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Contacto ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-8">
            <h2 className="font-display text-2xl md:text-3xl text-petrucci-black">
              Dónde encontrarnos
            </h2>

            {/* Mapa estático (link a Google Maps) */}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-sm border border-petrucci-border aspect-video bg-petrucci-border group"
              aria-label={`Ver ${address} en Google Maps`}
            >
              {/* Placeholder de mapa — iframe de Google Maps embebido */}
              <iframe
                title="Ubicación de Petrucci Joyería"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13464.876!2d-61.849!3d-31.896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95c9a!2sSan+Jorge,+Santa+Fe!5e0!3m2!1ses!2sar!4v1!5m2!1ses!2sar"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-0 bg-transparent group-hover:bg-petrucci-black/5 transition-colors" />
            </a>

            {/* Datos de contacto */}
            <address className="not-italic flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-petrucci-gold">
                  <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <div>
                  <p className="font-body text-xs tracking-wide text-petrucci-gray uppercase mb-0.5">Dirección</p>
                  <p className="font-body text-sm text-petrucci-black">{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-petrucci-gold">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="font-body text-xs tracking-wide text-petrucci-gray uppercase mb-0.5">Horarios</p>
                  <p className="font-body text-sm text-petrucci-black">{businessHours}</p>
                </div>
              </div>

              {instagramUrl && (
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 shrink-0 text-petrucci-gold">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                  <div>
                    <p className="font-body text-xs tracking-wide text-petrucci-gray uppercase mb-0.5">Instagram</p>
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-petrucci-black hover:text-petrucci-gold transition-colors">
                      @joyeriapetrucci
                    </a>
                  </div>
                </div>
              )}
            </address>

            {/* CTA WhatsApp */}
            {/* TODO: reemplazar href por el resultado de GET /catalog/whatsapp-link cuando esté disponible */}
            <a
              href="#contacto"
              aria-disabled="true"
              className="flex items-center justify-center gap-3 w-full py-4 bg-petrucci-black text-petrucci-cream font-body text-sm tracking-[0.15em] uppercase hover:bg-petrucci-gold transition-colors duration-300 mt-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
