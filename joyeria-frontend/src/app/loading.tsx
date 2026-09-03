import ProductCardSkeleton from "@/components/catalog/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-white">
      {/* Banner placeholder */}
      <div className="w-full aspect-[16/9] md:aspect-[21/9] max-h-[60vh] bg-gray-100 animate-pulse" />

      {/* Grid de productos skeleton */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-10 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
