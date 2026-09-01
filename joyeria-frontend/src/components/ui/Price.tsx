/**
 * components/ui/Price.tsx
 * Muestra el precio de un producto en ARS.
 *
 * Casos:
 *  - precio visible  → muestra "$150.000"
 *  - showPrice false → muestra "Consultar precio" (nunca recibe el valor)
 *  - size "lg"       → para ficha de producto (tipografía grande)
 *  - size "sm"       → para cards de listado
 */

import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceProps {
  value: string | null;
  size?: "sm" | "lg";
  className?: string;
}

export default function Price({ value, size = "sm", className }: PriceProps) {
  const formatted = formatPrice(value);

  if (!formatted) {
    return (
      <span
        className={cn(
          "font-body text-petrucci-gray italic",
          size === "lg" ? "text-base" : "text-sm",
          className
        )}
      >
        Consultar precio
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-body font-medium text-petrucci-black",
        size === "lg" ? "text-2xl" : "text-sm",
        className
      )}
    >
      {formatted}
    </span>
  );
}
