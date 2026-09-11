"use client";

import React from "react";
import Link from "next/link";

interface AtelierConsultationBannerProps {
  productName?: string;
  categoryName?: string;
}

export default function AtelierConsultationBanner({
  productName,
  categoryName,
}: AtelierConsultationBannerProps) {
  const whatsappConsultUrl = `https://wa.me/5493406419736?text=${encodeURIComponent(
    `Buenas, deseo consultar por una cita privada y opciones de personalización artesanal${
      productName ? ` para la pieza "${productName}"` : ""
    }.`
  )}`;

  return (
    <section className="my-16 md:my-24 bg-[#FAF9F7] border border-[#EAE7E1] p-8 md:p-14 relative overflow-hidden">
      {/* Detalle decorativo sutil de fondo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-[#EFECE6]/40 pointer-events-none blur-2xl" />
      
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <span className="font-body text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase text-amber-900/80 bg-amber-50/80 border border-amber-200/60 px-4 py-1.5 mb-5 inline-block">
          SERVICIO BOUTIQUE & ALTA PERSONALIZACIÓN
        </span>

        <h2 className="font-body text-2xl md:text-3xl text-gray-950 font-bold tracking-tight leading-tight max-w-2xl">
          ¿Desea una personalización de monograma o visita al atelier?
        </h2>

        <p className="font-body text-sm md:text-base text-gray-600 font-light mt-4 mb-8 max-w-2xl leading-relaxed">
          Nuestros expertos en orfebrería y alta manufactura le orientarán con muestras de metales nobles,
          cueros seleccionados y opciones de grabado láser o timbrado artesanal a medida.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href={whatsappConsultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-[#111111] hover:bg-black text-white font-body text-xs md:text-sm tracking-[0.18em] uppercase transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 group"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            <span>Conversar Ahora</span>
          </a>

          <Link
            href="/trabajos-personalizados"
            className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white text-[#111111] border border-[#111111] font-body text-xs md:text-sm tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center"
          >
            Agendar Cita Privada
          </Link>
        </div>

        <p className="font-body text-[11px] text-gray-400 mt-6 tracking-wide">
          PETRUCCI ATELIER • ATENCIÓN EXCLUSIVA CON CITA PREVIA
        </p>
      </div>
    </section>
  );
}
