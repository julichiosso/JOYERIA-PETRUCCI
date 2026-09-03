/**
 * components/catalog/ProductCardSkeleton.tsx
 * Esqueleto de carga con animación shimmer / pulso para tarjetas de producto.
 * Mantiene la misma estructura, proporciones e indicios visuales que ProductCard.
 */

export default function ProductCardSkeleton() {
  return (
    <article className="flex flex-col bg-white animate-pulse" aria-hidden="true">
      {/* Contenedor de foto cuadrada */}
      <div className="relative aspect-square w-full bg-gray-100 rounded-xs overflow-hidden border border-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-200/60" />
      </div>

      {/* Textos y precio */}
      <div className="flex flex-col gap-2 pt-3 text-left">
        {/* Nombre - 2 líneas */}
        <div className="h-3.5 bg-gray-200 rounded-xs w-5/6" />
        <div className="h-3.5 bg-gray-200/70 rounded-xs w-3/5" />

        {/* Precio principal */}
        <div className="h-4 bg-gray-200 rounded-xs w-2/5 mt-1" />

        {/* Descuento por transferencia */}
        <div className="h-3 bg-gray-100 rounded-xs w-3/4" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
