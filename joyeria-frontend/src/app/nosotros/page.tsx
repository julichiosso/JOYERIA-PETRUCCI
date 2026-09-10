/**
 * app/nosotros/page.tsx
 * Página "Quiénes Somos" / Nosotros — Petrucci Joyería
 * Tipografía Proxima Nova adoptada con diseño minimalista inspirado en Joyería El Rubí.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Quiénes Somos — Petrucci Joyería",
  description:
    "Joyería Petrucci: más de 25 años de tradición, taller propio y pasión orfebre en San Jorge, Santa Fe. Oro 18k, Plata 925 y relojería de precisión.",
};

export default async function NosotrosPage() {
  let storeConfig = null;
  try {
    storeConfig = await api.catalog.getStoreConfig();
  } catch {
    // fallback
  }

  const address = storeConfig?.address ?? "Eva Perón 1574, San Jorge, Santa Fe";
  const businessHours =
    storeConfig?.businessHours ?? "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00";
  const instagramUrl =
    storeConfig?.instagramUrl ?? "https://instagram.com/joyeriapetrucci";
  const facebookUrl = storeConfig?.facebookUrl ?? null;
  const whatsappNumber =
    storeConfig?.whatsappNumber?.replace(/\D/g, "") ?? "5493406440000";

  return (
    <div className="font-proxima bg-white text-[#222222] min-h-screen">
      {/* ── Breadcrumb & Header ────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-[#FAF9F7]/60">
        <div className="mx-auto max-w-5xl px-6 py-8 md:py-12">
          <nav aria-label="Migas de pan" className="mb-4">
            <ol className="flex items-center gap-2 text-xs tracking-wider uppercase text-gray-500">
              <li>
                <Link
                  href="/"
                  className="hover:text-black transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-300">
                /
              </li>
              <li className="text-gray-900 font-semibold" aria-current="page">
                Quiénes Somos
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-950 uppercase font-proxima">
            Quiénes Somos
          </h1>
          <div className="h-0.5 w-12 bg-amber-700 mt-4" />
        </div>
      </section>

      {/* ── Main Content Section ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Storytelling & Philosophy (Inspired by Joyería El Rubí) */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-[15px] md:text-[16px] leading-relaxed text-gray-700">
            <p className="font-medium text-gray-950 text-lg md:text-xl leading-snug">
              Joyería Petrucci se erige como una empresa de continuidad ininterrumpida y tradición familiar desde 1999 en San Jorge, Santa Fe.
            </p>

            <p>
              Con más de un cuarto de siglo de trayectoria y respaldada por la pasión del oficio orfebre, nuestra firma ha mantenido de manera constante la misma filosofía basada en la <strong>honestidad, la seriedad y el compromiso</strong> con cada cliente.
            </p>

            <p>
              Nos apasiona el arte de la joyería y creemos profundamente en la <em>carga simbólica y la identidad</em> que cada pieza lleva consigo. Seleccionamos y confeccionamos piezas en <strong>Oro 18 quilates, Plata 925</strong> y diversas combinaciones con piedras preciosas y semipreciosas, junto a una selecta colección de <strong>relojería de precisión</strong>.
            </p>

            <div className="my-2 p-5 bg-[#FAF9F7] border-l-2 border-amber-700 rounded-xs">
              <p className="italic text-gray-800 text-sm md:text-base leading-relaxed">
                &ldquo;Nuestro perpetuo objetivo es aspirar siempre a que nuestras joyas no solo sean objetos de belleza y distinción, sino arquitectas de momentos únicos e inolvidables en la vida de quienes las eligen.&rdquo;
              </p>
            </div>

            <p>
              La unidad, la intuición orfebre, la vocación hacia el trabajo artesanal y el trato personalizado convergen para forjar el nombre que hoy resuena con confianza y reconocimiento en toda la región.
            </p>

            {/* ── Pilares / Compromisos ─────────────────────────────────── */}
            <div className="pt-6 mt-4 border-t border-gray-100">
              <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-amber-800 mb-5">
                Nuestros Pilares &amp; Compromisos
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200/80 rounded-xs bg-white hover:border-gray-400 transition-colors">
                  <div className="text-amber-800 font-bold text-sm tracking-wider uppercase mb-1">
                    Oro 18K &amp; Plata 925
                  </div>
                  <p className="text-xs text-gray-600 leading-normal">
                    Garantía de pureza y autenticidad en cada pieza y metal noble.
                  </p>
                </div>

                <div className="p-4 border border-gray-200/80 rounded-xs bg-white hover:border-gray-400 transition-colors">
                  <div className="text-amber-800 font-bold text-sm tracking-wider uppercase mb-1">
                    Taller Propio
                  </div>
                  <p className="text-xs text-gray-600 leading-normal">
                    Grabados, alianzas de boda a medida y service especializado.
                  </p>
                </div>

                <div className="p-4 border border-gray-200/80 rounded-xs bg-white hover:border-gray-400 transition-colors">
                  <div className="text-amber-800 font-bold text-sm tracking-wider uppercase mb-1">
                    25+ Años de Confianza
                  </div>
                  <p className="text-xs text-gray-600 leading-normal">
                    Atención personalizada cara a cara y acompañamiento en cada elección.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Location, Hours, Contact Card & Map */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#FAF9F7] p-6 md:p-8 border border-gray-200/70 rounded-xs">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-950 mb-6 pb-2 border-b border-gray-200">
                Dónde encontrarnos
              </h2>

              <address className="not-italic space-y-5 text-sm text-gray-700">
                <div className="flex items-start gap-3.5">
                  <svg
                    className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                      Dirección
                    </span>
                    <span className="font-medium text-gray-900">{address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <svg
                    className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                      Horarios de Atención
                    </span>
                    <span className="font-medium text-gray-900">{businessHours}</span>
                  </div>
                </div>

                {instagramUrl && (
                  <div className="flex items-start gap-3.5">
                    <svg
                      className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth={1.5} />
                      <path
                        strokeWidth={1.5}
                        d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
                      />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
                    </svg>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                        Instagram
                      </span>
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-amber-800 transition-colors"
                      >
                        @joyeriapetrucci
                      </a>
                    </div>
                  </div>
                )}
              </address>

              {/* WhatsApp Button CTA */}
              <div className="mt-7 pt-5 border-t border-gray-200">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    "¡Hola! Me gustaría consultar por una joya o trabajo personalizado."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-gray-950 hover:bg-black text-white text-xs font-bold tracking-widest uppercase transition-all duration-200 shadow-xs hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 fill-current text-green-400"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.542 1.875.83 2.796.83h.005c3.177 0 5.766-2.587 5.768-5.766.002-3.18-2.584-5.817-5.773-5.817zm7.969 5.766c-.003 4.418-3.593 8.007-8.006 8.007-1.349 0-2.673-.34-3.843-.984l-4.151 1.089 1.109-4.049c-.73-1.233-1.119-2.65-1.118-4.063.003-4.417 3.593-8.006 8.006-8.006 4.419 0 8.006 3.588 8.003 8.006z" />
                  </svg>
                  Consultar por WhatsApp
                </a>
              </div>
            </div>

            {/* Google Maps Iframe */}
            <div className="overflow-hidden border border-gray-200 rounded-xs aspect-video bg-gray-100 shadow-2xs">
              <iframe
                title="Ubicación de Petrucci Joyería"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13464.876!2d-61.849!3d-31.896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95c9a!2sSan+Jorge,+Santa+Fe!5e0!3m2!1ses!2sar!4v1!5m2!1ses!2sar"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}