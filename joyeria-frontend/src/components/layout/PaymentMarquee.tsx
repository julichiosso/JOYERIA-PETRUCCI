"use client";

/**
 * components/layout/PaymentMarquee.tsx
 * Barra horizontal de medios de pago agrupados por tipo (Tarjetas / Digitales y Transferencia).
 * Estética de lujo y confianza con badges vectoriales prolijos.
 */

export default function PaymentMarquee() {
  return (
    <div className="bg-[#FAF9F7] border-b border-gray-200/70 py-3.5 px-4">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500 font-body">
        
        {/* Grupo 1: Tarjetas de Crédito y Débito */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
            Tarjetas
          </span>
          <div className="flex items-center gap-1.5">
            {/* Visa */}
            <div className="h-6 px-2 bg-white border border-gray-200 rounded-xs flex items-center justify-center shadow-2xs" title="Visa">
              <svg width="28" height="14" viewBox="0 0 50 24" fill="none">
                <path d="M19.5 6L15.2 18H12L7.7 9.2c-.3-.6-.5-.8-1-.9C5.8 8 4.5 7.6 3 7.4l.1-.4h5c.6 0 1.2.4 1.3 1.1l1.2 6.4 3-7.5h3.9zm4.9 12h-3.7l2.3-12h3.7l-2.3 12zm13.3-7.8c0-3.3-4.6-3.5-4.5-5 0-.5.4-.9 1.4-1 .5-.1 1.8-.1 3.2.6l.6-2.7C37.2 1.7 36 1.5 34.6 1.5c-3.5 0-6 1.8-6 4.4 0 1.9 1.7 3 3 3.6 1.3.7 1.8 1.1 1.8 1.7 0 .9-1.1 1.3-2 1.3-1.7 0-2.7-.5-3.5-.8l-.6 2.8c.8.4 2.2.7 3.7.7 3.7 0 6.2-1.8 6.2-4.6v-.4zm9.1 7.8h3.3L47 6h-3c-.7 0-1.3.4-1.5 1l-5.5 11h3.8l.8-2.1h4.7l.5 2.1zm-4-5l1.9-5.3.9 5.3h-2.8z" fill="#1A1F71"/>
              </svg>
            </div>

            {/* Mastercard */}
            <div className="h-6 px-2 bg-white border border-gray-200 rounded-xs flex items-center justify-center shadow-2xs" title="Mastercard">
              <svg width="24" height="14" viewBox="0 0 32 20" fill="none">
                <circle cx="11" cy="10" r="8" fill="#EB001B" />
                <circle cx="21" cy="10" r="8" fill="#F79E1B" fillOpacity="0.9" />
              </svg>
            </div>

            {/* American Express */}
            <div className="h-6 px-2 bg-[#006FCF] border border-[#006FCF] rounded-xs flex items-center justify-center shadow-2xs" title="American Express">
              <span className="text-[8px] font-black text-white tracking-tighter uppercase">AMEX</span>
            </div>

            {/* Tarjeta Naranja */}
            <div className="h-6 px-2 bg-[#FF6600] border border-[#FF6600] rounded-xs flex items-center justify-center shadow-2xs" title="Tarjeta Naranja">
              <span className="text-[8px] font-bold text-white uppercase tracking-tight">Naranja</span>
            </div>

            {/* Cabal */}
            <div className="h-6 px-2 bg-white border border-gray-200 rounded-xs flex items-center justify-center shadow-2xs" title="Cabal">
              <span className="text-[8px] font-bold text-[#D02B2B] uppercase tracking-tight">CABAL</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-4 bg-gray-200" />

        {/* Grupo 2: Digitales & Transferencia */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
            Medios Digitales &amp; Bancarios
          </span>
          <div className="flex items-center gap-1.5">
            {/* Mercado Pago */}
            <div className="h-6 px-2.5 bg-white border border-gray-200 rounded-xs flex items-center gap-1 shadow-2xs" title="Mercado Pago">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#009EE3"/>
                <path d="M7 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="13.5" r="1.5" fill="#fff"/>
              </svg>
              <span className="text-[9px] font-bold text-[#009EE3]">Mercado Pago</span>
            </div>

            {/* Transferencia con descuento */}
            <div className="h-6 px-2.5 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center gap-1 shadow-2xs" title="Transferencia Bancaria con 15% OFF">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-semibold text-emerald-800">Transferencia (15% OFF)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}