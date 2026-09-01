/**
 * components/product/WhatsAppButton.tsx
 * Botón "Consultar por WhatsApp" en la ficha de producto.
 *
 * Responsabilidad:
 *  1. Llama a POST /catalog/inquiries con productId + variantId opcional
 *  2. Abre la URL de WhatsApp que devuelve el backend
 *  3. Maneja el estado de carga (no duplicar clics)
 *
 * Es un Client Component ("use client") porque necesita interacción del usuario.
 * Se construye en detalle en la etapa de ficha de producto.
 */

"use client";

interface WhatsAppButtonProps {
  productId: string;
  variantId?: string;
  productUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function WhatsAppButton(_props: WhatsAppButtonProps) {
  return null;
}
