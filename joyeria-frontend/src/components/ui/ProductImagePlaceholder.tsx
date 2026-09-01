/**
 * components/ui/ProductImagePlaceholder.tsx
 * Placeholder para productos sin foto todavía.
 *
 * Problema de negocio: el catálogo se carga gradualmente — no todas las
 * piezas están fotografiadas desde el día uno. Sin este componente,
 * una tarjeta con imagen rota se vería improvisada y poco profesional.
 *
 * Diseño: fondo beige oscuro + ícono de diamante (SVG inline, sin deps externas)
 * Relación de aspecto: 3:4 (vertical, típico de producto de joyería)
 */

import { cn } from "@/lib/utils";

interface ProductImagePlaceholderProps {
  className?: string;
  aspectRatio?: "3/4" | "1/1" | "4/3";
}

export default function ProductImagePlaceholder({
  className,
  aspectRatio = "3/4",
}: ProductImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "bg-[#EDE8E1]", // Beige suave — neutro, no llama la atención
        aspectRatio === "3/4" && "aspect-[3/4]",
        aspectRatio === "1/1" && "aspect-square",
        aspectRatio === "4/3" && "aspect-[4/3]",
        className
      )}
      aria-hidden="true"
      role="img"
      aria-label="Imagen del producto próximamente"
    >
      {/* SVG de diamante inline — 0 requests de red, 0 dependencias */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 6L36 18L24 42L12 18L24 6Z"
          stroke="#C4B9A8"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M12 18H36"
          stroke="#C4B9A8"
          strokeWidth="1.5"
        />
        <path
          d="M16 12L12 18L24 18L20 12Z"
          stroke="#C4B9A8"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M32 12L36 18H24L28 12Z"
          stroke="#C4B9A8"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
