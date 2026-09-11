"use client";

/**
 * components/product/WhatsAppButton.tsx
 * Botón "Consultar por WhatsApp" en la ficha de producto.
 * Registra la consulta en el backend vía POST /catalog/inquiries antes de abrir WhatsApp.
 */

import { useState } from "react";

interface WhatsAppButtonProps {
  productId: string;
  variantId?: string;
  productUrl?: string;
  fallbackUrl?: string;
  className?: string;
}

export default function WhatsAppButton({
  productId,
  variantId,
  productUrl,
  fallbackUrl,
  className = "",
}: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    let targetUrl = fallbackUrl || "https://wa.me/5493406419736";

    try {
      const res = await fetch(`${apiUrl}/catalog/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: variantId || undefined,
          productUrl: productUrl || (typeof window !== "undefined" ? window.location.href : undefined),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { whatsappUrl?: string };
        if (data.whatsappUrl) {
          targetUrl = data.whatsappUrl;
        }
      }
    } catch {
      // Usa targetUrl fallback
    } finally {
      setLoading(false);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-4 px-6 bg-[#111111] text-white text-[12px] tracking-[0.18em] uppercase font-semibold flex items-center justify-center gap-3 hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-70 ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
      )}
      <span>Consultar por WhatsApp</span>
    </button>
  );
}
