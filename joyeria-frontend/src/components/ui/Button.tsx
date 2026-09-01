/**
 * components/ui/Button.tsx
 * Átomo base de botón — todas las variantes del sistema de diseño Petrucci.
 *
 * Variantes:
 *  - "primary"  → fondo dorado, texto blanco (CTA principal: "Consultar por WhatsApp")
 *  - "outline"  → borde dorado, sin fondo (CTA secundario)
 *  - "ghost"    → sin borde ni fondo (acciones sutiles: "Ver más")
 *
 * Tamaños:
 *  - "sm"  → nav, badges
 *  - "md"  → botones estándar
 *  - "lg"  → CTA hero, botón de WhatsApp en ficha de producto
 */

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const variants = {
  primary:
    "bg-petrucci-gold text-white hover:bg-[#9A7A50] focus-visible:ring-petrucci-gold",
  outline:
    "border border-petrucci-gold text-petrucci-gold hover:bg-petrucci-gold hover:text-white focus-visible:ring-petrucci-gold",
  ghost:
    "text-petrucci-black hover:text-petrucci-gold focus-visible:ring-petrucci-gold",
};

const sizes = {
  sm: "px-4 py-2 text-xs tracking-widest",
  md: "px-6 py-3 text-sm tracking-widest",
  lg: "px-8 py-4 text-sm tracking-widest",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base
        "inline-flex items-center justify-center gap-2",
        "font-body font-medium uppercase",
        "transition-all duration-200 ease-[var(--ease-petrucci)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Variante y tamaño
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
