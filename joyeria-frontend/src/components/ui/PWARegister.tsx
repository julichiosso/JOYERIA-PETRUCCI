"use client";
/**
 * components/ui/PWARegister.tsx
 * Registra el service worker en el lado del cliente (solo en producción/browsers compatibles).
 */
import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // El registro del SW no debe interrumpir la experiencia si falla
        });
      });
    }
  }, []);
  return null;
}
