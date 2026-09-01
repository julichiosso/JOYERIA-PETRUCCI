"use client";

/**
 * components/ui/WhatsAppFAB.tsx
 * Botón flotante de WhatsApp visible en todas las páginas.
 *
 * El link general de la tienda viene de GET /catalog/whatsapp-link (pendiente).
 * Mientras ese endpoint no exista, el FAB se muestra deshabilitado (apariencia
 * idéntica pero sin href navegable) con un tooltip que explica la situación.
 *
 * Cuando el backend tenga el endpoint:
 *  1. Agregar getWhatsAppLink al layout (Server Component) y pasarlo como prop
 *     OR usar un Client-side fetch en useEffect.
 *  2. Pasar la URL como prop `href` a este componente.
 *
 * Los links POR PRODUCTO (product.whatsappLink) no usan este componente.
 */

import { motion } from "framer-motion";

interface WhatsAppFABProps {
  /** URL completa wa.me/... — null mientras el endpoint no esté listo */
  href: string | null;
}

export default function WhatsAppFAB({ href }: WhatsAppFABProps) {
  const isReady = Boolean(href);

  const commonProps = {
    "aria-label": "Consultá por WhatsApp",
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { delay: 1.2, type: "spring" as const, stiffness: 260, damping: 20 },
    whileHover: { scale: isReady ? 1.1 : 1 },
    whileTap: { scale: isReady ? 0.95 : 1 },
    className:
      "fixed bottom-6 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] group",
    style: { backgroundColor: isReady ? "#25D366" : "#9CA3AF" } as React.CSSProperties,
  };

  const inner = (
    <>
      <svg viewBox="0 0 24 24" fill="white" width="26" height="26" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      <span
        className="absolute right-16 bg-petrucci-black text-petrucci-cream text-xs font-body tracking-wide py-1.5 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        role="tooltip"
      >
        {isReady ? "¡Consultá por WhatsApp!" : "WhatsApp próximamente"}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      >
        {inner}
      </motion.a>
    );
  }

  // Sin href: renderizar como <div> — visible pero no navegable
  return (
    <motion.div {...commonProps}>
      {inner}
    </motion.div>
  );
}
