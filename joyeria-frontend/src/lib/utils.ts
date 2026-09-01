/**
 * lib/utils.ts
 * Helpers puros — sin JSX, sin imports de React.
 * Reutilizables desde cualquier componente o Server Component.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — Composer de clases Tailwind sin conflictos.
 * Ejemplo: cn("px-4 py-2", isActive && "bg-petrucci-gold", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatPrice() — Formatea un precio del backend (string Decimal) a ARS.
 * Retorna null si el precio es null (showPrice: false).
 *
 * Ejemplos:
 *   formatPrice("150000.00") → "$\u202f150.000"
 *   formatPrice(null)        → null
 */
export function formatPrice(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * truncate() — Recorta un texto a N caracteres sin cortar palabras.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(" ", maxLength)) + "…";
}
