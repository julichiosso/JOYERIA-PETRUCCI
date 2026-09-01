"use client";

/**
 * app/admin/productos/nuevo/page.tsx
 * Página para crear un nuevo producto.
 */

import ProductForm from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="font-body text-xl font-semibold text-gray-900">
          Nuevo producto
        </h1>
        <p className="font-body text-xs text-gray-500 mt-1">
          Completá los datos y guardá para publicar en la tienda.
        </p>
      </div>

      {/* Formulario */}
      <ProductForm />
    </div>
  );
}
