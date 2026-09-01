"use client";

/**
 * components/ui/CookieBanner.tsx
 * Banner de cookies — banner inferior fijo.
 *
 * Comportamiento:
 *  - Se muestra la primera vez que el usuario visita el sitio
 *  - Al hacer clic en "ENTENDIDO", se guarda en localStorage y no vuelve a aparecer
 *  - Si localStorage no está disponible (SSR), no se muestra
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "petrucci_cookies_accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Solo en browser — verificar si ya aceptó
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      // localStorage no disponible (modo privado restringido, etc.)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // silencioso
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-petrucci-border bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-10 py-3.5 flex items-center justify-between gap-4">
        <p className="font-body text-xs text-petrucci-gray leading-snug">
          Al navegar por este sitio aceptás el uso de cookies para agilizar tu
          experiencia de compra.
        </p>
        <button
          onClick={accept}
          className="shrink-0 font-body text-[10px] tracking-[0.18em] uppercase font-medium text-petrucci-black border border-petrucci-black px-4 py-2 hover:bg-petrucci-black hover:text-petrucci-cream transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrucci-black focus-visible:ring-offset-1"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
