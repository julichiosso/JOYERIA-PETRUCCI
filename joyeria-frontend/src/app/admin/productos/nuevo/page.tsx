"use client";

/**
 * app/admin/productos/nuevo/page.tsx
 * Página para crear un nuevo producto.
 */

import ProductForm from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-sans text-[#1D1D1F] pb-16">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
          Cargar Nueva Joya
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-normal">
          Completá los datos básicos y cargá la foto para publicar en la tienda web.
        </p>
      </div>

      {/* Formulario */}
      <ProductForm />
    </div>
  );
}
