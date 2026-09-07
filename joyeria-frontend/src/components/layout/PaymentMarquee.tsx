"use client";

/**
 * components/layout/PaymentMarquee.tsx
 * Barra horizontal minimalista y compacta con scroll infinito de medios de pago.
 * SVGs vectoriales en tamaño sutil y elegante acorde a la estética de joyería.
 */

const paymentLogos = [
  {
    name: "Mercado Pago",
    svg: `<svg width="65" height="17" viewBox="0 0 90 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="mpGradWeb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00B1EA"/><stop offset="1" stop-color="#009EE3"/></linearGradient></defs><circle cx="12" cy="12" r="12" fill="url(#mpGradWeb)"/><path d="M6 13.5c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="13.5" r="2" fill="#fff"/><text x="27" y="10" font-size="7" font-weight="700" fill="#009EE3" font-family="Arial">MERCADO</text><text x="27" y="19" font-size="7" font-weight="700" fill="#009EE3" font-family="Arial">PAGO</text></svg>`,
  },
  {
    name: "Visa",
    svg: `<svg width="36" height="17" viewBox="0 0 50 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 6L15.2 18H12L7.7 9.2c-.3-.6-.5-.8-1-.9C5.8 8 4.5 7.6 3 7.4l.1-.4h5c.6 0 1.2.4 1.3 1.1l1.2 6.4 3-7.5h3.9zm4.9 12h-3.7l2.3-12h3.7l-2.3 12zm13.3-7.8c0-3.3-4.6-3.5-4.5-5 0-.5.4-.9 1.4-1 .5-.1 1.8-.1 3.2.6l.6-2.7C37.2 1.7 36 1.5 34.6 1.5c-3.5 0-6 1.8-6 4.4 0 1.9 1.7 3 3 3.6 1.3.7 1.8 1.1 1.8 1.7 0 .9-1.1 1.3-2 1.3-1.7 0-2.7-.5-3.5-.8l-.6 2.8c.8.4 2.2.7 3.7.7 3.7 0 6.2-1.8 6.2-4.6v-.4zm9.1 7.8h3.3L47 6h-3c-.7 0-1.3.4-1.5 1l-5.5 11h3.8l.8-2.1h4.7l.5 2.1zm-4-5l1.9-5.3.9 5.3h-2.8z" fill="#1A1F71"/></svg>`,
  },
];

export default function PaymentMarquee() {
  // Duplicamos 4 veces para la animación continuA
  const repeated = [...paymentLogos, ...paymentLogos, ...paymentLogos, ...paymentLogos];

  return (
    <div className="bg-[#FAF9F7] border-b border-gray-100 py-2.5 overflow-hidden payment-marquee-container">
      <div className="payment-marquee-track">
        {repeated.map((logo, i) => (
          <div
            key={i}
            className="h-7 px-2.5 bg-white border border-gray-200/80 rounded shadow-2xs flex items-center justify-center hover:border-gray-300 transition-colors shrink-0"
            title={logo.name}
            dangerouslySetInnerHTML={{ __html: logo.svg }}
          />
        ))}
      </div>
    </div>
  );
}