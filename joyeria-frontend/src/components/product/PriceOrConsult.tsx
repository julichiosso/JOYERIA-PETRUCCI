"use client";

/**
 * src/components/product/PriceOrConsult.tsx
 * Muestra el precio formateado en Pesos Argentinos ($ X.XXX.XXX)
 * o el badge de conversión "Consultar precio" con enlace directo a WhatsApp.
 */

import React from "react";
import type { ProductStatus } from "@/types/product";

interface PriceOrConsultProps {
    price: string | number | null;
    showPrice: boolean;
    status?: ProductStatus;
    whatsappUrl?: string;
    productName?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function formatARS(value: string | number | null): string {
    if (value === null || value === undefined || value === "") return "";
    const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(num);
}

export default function PriceOrConsult({
    price,
    showPrice,
    status,
    whatsappUrl,
    productName,
    size = "md",
    className = "",
}: PriceOrConsultProps) {
    // Estado Sin Stock
    if (status === "OUT_OF_STOCK") {
        return (
            <div className={`inline-flex items-center gap-1.5 ${className}`}>
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-body text-xs md:text-sm font-semibold text-rose-800 uppercase tracking-wider">
                    Sin Stock
                </span>
            </div>
        );
    }

    // Si showPrice es true y tenemos precio válido
    if (showPrice && price !== null && price !== undefined && price !== "") {
        const formatted = formatARS(price);
        const sizeClasses =
            size === "lg"
                ? "text-xl md:text-2xl font-bold tracking-tight text-gray-950"
                : size === "sm"
                    ? "text-sm font-bold text-gray-950"
                    : "text-base md:text-lg font-bold text-gray-950";

        return (
            <div className={`flex items-baseline gap-1.5 ${className}`}>
                <span className={sizeClasses}>{formatted}</span>
                <span className="text-[10px] uppercase font-semibold text-gray-400">ARS</span>
            </div>
        );
    }

    // Si showPrice es false o no hay precio -> Mostrar "Consultar precio" con opción a WhatsApp
    const consultText = "Consultar precio";
    const defaultWhatsAppMsg = productName
        ? `Hola Petrucci Joyería! Quisiera consultar el precio de "${productName}".`
        : "Hola Petrucci Joyería! Quisiera realizar una consulta sobre sus joyas.";

    const href =
        whatsappUrl ||
        `https://wa.me/?text=${encodeURIComponent(defaultWhatsAppMsg)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 font-body text-xs md:text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-200/80 transition-colors group cursor-pointer ${className}`}
            title="Consultar precio por WhatsApp"
        >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{consultText}</span>
            <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform text-xs">
                →
            </span>
        </a>
    );
}
