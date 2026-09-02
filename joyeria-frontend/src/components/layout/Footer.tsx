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

const DEFAULT_CONFIG: PublicStoreConfig = {
  storeName: "Joyería El Rubí",
  address: "San Martín 2334, Santa Fe",
  businessHours: "Lun–Vie 9:00–18:00 · Sáb 9:00–13:00",
  instagramUrl: "https://instagram.com/joyeriaelrubi",
  facebookUrl: "https://facebook.com/joyeriaelrubi",
  whatsappNumber: "5493426444040",
  returnPolicy: null,
  shippingInfo: null,
};

// ─── SVGs de los 18 medios de pago y tarjetas ───────────────────────────────────

function VisaCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Visa">
      <svg width="34" height="12" viewBox="0 0 48 16" fill="none">
        <path d="M19.5 1.5L14.2 14.5H10.1L6.1 4.2C5.9 3.4 5.7 3.1 5.1 2.8C3.9 2.2 1.9 1.6 0.2 1.2L0.3 0.8H7.3C8.2 0.8 9 1.4 9.2 2.5L11 11.8L15.3 0.8H19.5ZM36.2 10.2C36.2 6.5 31.1 6.3 31.2 4.6C31.2 4 31.8 3.4 33 3.3C33.6 3.2 35.2 3.2 36.9 4L37.6 0.8C36.6 0.4 35.3 0.1 33.7 0.1C29.6 0.1 26.8 2.3 26.8 5.4C26.8 7.7 28.9 9 30.5 9.8C32.1 10.6 32.7 11.1 32.7 11.8C32.7 12.9 31.3 13.4 30.1 13.4C27.9 13.4 26.7 13.1 25.1 12.3L24.3 15.7C25.6 16.3 27.7 16.7 29.8 16.7C34.2 16.7 37 14.5 37 11.2L36.2 10.2ZM47.8 14.5H44.1L41.2 0.8H45L47.8 14.5ZM26.4 0.8L23.1 14.5H19.3L22.6 0.8H26.4Z" fill="#1A1F71" />
      </svg>
    </div>
  );
}

function MastercardCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Mastercard">
      <svg width="26" height="16" viewBox="0 0 32 20" fill="none">
        <circle cx="11" cy="10" r="9" fill="#EB001B" />
        <circle cx="21" cy="10" r="9" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

function AmexCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="American Express">
      <div className="bg-[#0070D2] rounded-[2px] px-1.5 py-0.5 flex items-center justify-center">
        <span className="text-[9px] font-black text-white tracking-tighter leading-none">AMEX</span>
      </div>
    </div>
  );
}

function DinersCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Diners Club">
      <div className="flex items-center gap-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#0079BE">
          <circle cx="12" cy="12" r="10" fill="#0079BE" />
          <path d="M10 7h4a5 5 0 0 1 0 10h-4V7z" fill="white" />
        </svg>
        <span className="text-[8px] font-bold text-[#0079BE]">Diners</span>
      </div>
    </div>
  );
}

function CabalCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Cabal">
      <div className="bg-[#004C97] text-white px-1.5 py-0.5 rounded-[2px] flex items-center justify-center">
        <span className="text-[8px] font-black tracking-tighter">CABAL</span>
      </div>
    </div>
  );
}

function NaranjaCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Tarjeta Naranja X">
      <div className="bg-[#FF5A00] text-white px-1.5 py-0.5 rounded-[2px] flex items-center justify-center">
        <span className="text-[9px] font-black italic tracking-tighter">NX</span>
      </div>
    </div>
  );
}

function TarjetaShoppingCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Tarjeta Shopping">
      <div className="bg-[#FFCC00] text-[#111] px-1 py-0.5 rounded-[2px] flex flex-col items-center justify-center leading-none">
        <span className="text-[6px] font-extrabold uppercase">TARJETA</span>
        <span className="text-[6px] font-extrabold uppercase">SHOPPING</span>
      </div>
    </div>
  );
}

function EfectivoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Efectivo">
      <svg width="18" height="12" viewBox="0 0 24 16" fill="none" stroke="#444" strokeWidth="1.5">
        <rect x="1" y="1" width="22" height="14" rx="2" />
        <circle cx="12" cy="8" r="3" />
        <line x1="4" y1="5" x2="4" y2="11" />
        <line x1="20" y1="5" x2="20" y2="11" />
      </svg>
    </div>
  );
}

function PagoFacilCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Pago Fácil">
      <div className="flex items-center gap-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#333">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#FFE500" stroke="#333" strokeWidth="1.5" />
          <path d="M7 8h10M7 12h7M7 16h5" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function NativaCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Nativa">
      <div className="bg-[#E30613] text-white w-4 h-4 rounded-full flex items-center justify-center">
        <span className="text-[8px] font-black italic">a</span>
      </div>
    </div>
  );
}

function NativaNacionCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Nativa Nación">
      <div className="flex items-center gap-0.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#8DC63F] inline-block" />
        <span className="text-[8px] font-semibold text-[#006837] italic">nativa</span>
      </div>
    </div>
  );
}

function CabalDebitoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Cabal Débito">
      <div className="border border-[#004C97] text-[#004C97] px-1 py-0.5 rounded-[2px] flex items-center justify-center">
        <span className="text-[7px] font-extrabold tracking-tighter">CABAL</span>
      </div>
    </div>
  );
}

function MastercardDebitoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Mastercard Débito / Maestro">
      <svg width="22" height="14" viewBox="0 0 32 20" fill="none">
        <circle cx="11" cy="10" r="9" fill="#EB001B" />
        <circle cx="21" cy="10" r="9" fill="#0066CC" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

function VisaDebitoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Visa Débito">
      <div className="flex items-center gap-0.5">
        <span className="text-[9px] font-black italic text-[#1A1F71]">VISA</span>
        <span className="text-[5px] font-bold text-[#EAA123] uppercase">Débito</span>
      </div>
    </div>
  );
}

function ModoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="MODO">
      <div className="bg-[#E6007E] text-[#FFDE00] px-1.5 py-0.5 rounded-[2px] flex items-center justify-center">
        <span className="text-[8px] font-black tracking-tight">MODO</span>
      </div>
    </div>
  );
}

function RapipagoCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Rapipago">
      <div className="flex items-center">
        <span className="text-[8px] font-black italic text-[#005CA9]">rapi</span>
        <span className="text-[8px] font-black italic text-[#E30613]">pago</span>
      </div>
    </div>
  );
}

function CrucenubeCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Billetera virtual">
      <div className="flex flex-col items-center justify-center leading-none">
        <svg width="14" height="10" viewBox="0 0 24 16" fill="none" stroke="#009EE3" strokeWidth="2.5">
          <path d="M7 13a5 5 0 0 1-2-9.6A7 7 0 0 1 18 6a4 4 0 0 1 0 7z" />
        </svg>
        <span className="text-[5px] font-semibold text-[#009EE3]">crucenube</span>
      </div>
    </div>
  );
}

function ArgencardCard() {
  return (
    <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs shrink-0" title="Argencard">
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-3.5 h-3.5 rounded-full border border-[#D91B24] flex items-center justify-center text-[#D91B24]">
          <span className="text-[7px] font-black">A</span>
        </div>
        <span className="text-[5px] font-bold text-[#D91B24] tracking-tighter mt-0.5">ARGENCARD</span>
      </div>
    </div>
  );
}

// ─── Componente Principal Footer ────────────────────────────────────────────────

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
              <a href="mailto:ventas@joyeriaelrubi.com.ar" className="hover:text-black transition-colors block">
                ventas@joyeriaelrubi.com.ar
              </a>
              <p className="text-gray-700">{address}</p>
            </div>
          </div>
        </div>

        {/* ── Medios de Pago (18 Tarjetas) ─────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-100 flex items-center justify-center gap-1.5 flex-wrap">
          <VisaCard />
          <MastercardCard />
          <AmexCard />
          <DinersCard />
          <CabalCard />
          <NaranjaCard />
          <TarjetaShoppingCard />
          <EfectivoCard />
          <PagoFacilCard />
          <NativaCard />
          <NativaNacionCard />
          <CabalDebitoCard />
          <MastercardDebitoCard />
          <VisaDebitoCard />
          <ModoCard />
          <RapipagoCard />
          <CrucenubeCard />
          <ArgencardCard />
        </div>

        {/* ── Texto Legal / Defensa del Consumidor / Copyright ───────────────── */}
        <div className="mt-8 text-center text-xs text-gray-600 leading-relaxed flex flex-col items-center gap-3">
          <p>
            Copyright Joyería El Rubí - 2026. Todos los derechos reservados. Defensa de las y los consumidores. Para reclamos{" "}
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
