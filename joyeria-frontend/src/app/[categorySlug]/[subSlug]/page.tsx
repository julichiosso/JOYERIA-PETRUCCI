/**
 * app/[categorySlug]/[subSlug]/page.tsx
 * Maneja subcategorias y detalle de producto con seccion de relacionados.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { api } from "@/lib/api";
import CategoryCatalogView from "@/components/catalog/CategoryCatalogView";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ categorySlug: string; subSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, subSlug } = await params;
  try {
    const { categories } = await api.catalog.getCategories();
    const parent = categories.find((c) => {
      if (!c.isActive) return false;
      const s = c.slug.toLowerCase();
      const target = categorySlug.toLowerCase();
      return s === target || s.includes(target) || target.includes(s);
    });
    const sub = parent?.children?.find((c) => {
      if (c.isActive === false) return false;
      const s = c.slug.toLowerCase();
      const target = subSlug.toLowerCase();
      return s === target || s.startsWith(target) || target.startsWith(s);
    });
    if (sub) {
      return {
        title: `${sub.name} - Petrucci Joyeria`,
        description: sub.description ?? `Catalogo de ${sub.name.toLowerCase()} - Consulta por WhatsApp.`,
      };
    }
    const product = await api.catalog.getProductBySlug(subSlug);
    if (product) {
      return {
        title: product.metaTitle || `${product.name} - Petrucci Joyeria`,
        description: product.metaDescription || `Consulta por "${product.name}" en Petrucci Joyeria.`,
        openGraph: {
          title: product.metaTitle || `${product.name} - Petrucci Joyeria`,
          description: product.metaDescription || `Consulta por "${product.name}" en Petrucci Joyeria.`,
          images: product.images.length > 0 ? [product.images[0].url] : [],
        },
      };
    }
  } catch { /* fallback */ }
  return {};
}

export default async function SubcategoryOrProductPage({ params, searchParams }: PageProps) {
  const { categorySlug, subSlug } = await params;
  const { page: pageParam } = await searchParams;

  let parent = null;
  let subcategory = null;
  let isSubcategory = false;

  try {
    const { categories } = await api.catalog.getCategories();
    parent = categories.find((c) => {
      if (!c.isActive) return false;
      const s = c.slug.toLowerCase();
      const target = categorySlug.toLowerCase();
      return s === target || s.includes(target) || target.includes(s);
    }) ?? null;
    if (parent) {
      subcategory = parent.children?.find((c) => {
        if (c.isActive === false) return false;
        const s = c.slug.toLowerCase();
        const target = subSlug.toLowerCase();
        return s === target || s.startsWith(target) || target.startsWith(s);
      }) ?? null;
      isSubcategory = Boolean(subcategory);
    }
  } catch { /* continua */ }

  // CASO 1: Subcategoria
  if (isSubcategory && subcategory && parent) {
    const page = Math.max(1, parseInt(pageParam ?? "1", 10));
    let products: Product[] = [];
    try {
      const response = await api.catalog.getProducts({ categoryId: subcategory.id, page, limit: 40 });
      products = response.items.filter((p) => p.status === "ACTIVE");
    } catch { /* grilla vacia */ }
    return (
      <>
        <div className="border-b border-petrucci-border bg-white">
          <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
            <nav aria-label="Migas de pan" className="mb-4">
              <ol className="flex items-center gap-1.5 font-body text-xs text-petrucci-gray">
                <li><Link href="/" className="hover:text-petrucci-gold transition-colors">Inicio</Link></li>
                <li aria-hidden="true">›</li>
                <li><Link href={`/${categorySlug}`} className="hover:text-petrucci-gold transition-colors">{parent.name}</Link></li>
                <li aria-hidden="true">›</li>
                <li className="text-petrucci-black" aria-current="page">{subcategory.name}</li>
              </ol>
            </nav>
            <h1 className="font-display text-3xl md:text-5xl text-petrucci-black font-normal">{subcategory.name}</h1>
            {subcategory.description && (
              <p className="mt-3 font-body text-sm text-petrucci-gray max-w-xl leading-relaxed">{subcategory.description}</p>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12">
          <CategoryCatalogView initialProducts={products} categoryName={subcategory.name} />
        </div>
      </>
    );
  }

  // CASO 2: Producto de categoria directa
  let product;
  try {
    product = await api.catalog.getProductBySlug(subSlug);
  } catch {
    notFound();
  }
  if (!product) notFound();

  // Productos relacionados
  let relatedProducts: Product[] = [];
  try {
    const response = await api.catalog.getProducts({ categoryId: product.category.id, page: 1, limit: 8 });
    relatedProducts = response.items.filter((p) => p.status === "ACTIVE" && p.id !== product.id).slice(0, 4);
  } catch { /* sin relacionados */ }

  const breadcrumbLinks = [
    { label: "Inicio", href: "/" },
    { label: product.category.name, href: `/${product.category.slug}` },
    { label: product.name, href: null },
  ];

  return (
    <>
      <Script id="json-ld-product" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.product) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product.jsonLd.breadcrumb) }} />
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-5 md:px-10 py-6 md:py-10">
          <nav aria-label="Migas de pan" className="mb-8 md:mb-10">
            <ol className="flex items-center flex-wrap gap-1 font-body text-xs text-gray-500">
              {breadcrumbLinks.map((crumb, index) => (
                <li key={index} className="flex items-center gap-1">
                  {index > 0 && <span aria-hidden="true" className="mx-0.5 text-gray-300">›</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-gray-900 transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="font-medium text-gray-900 truncate max-w-[180px]" aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <ProductDetailClient product={product} />
        </div>
        {relatedProducts.length > 0 && (
          <div className="border-t border-[#EBEBEB] mt-12 md:mt-16">
            <div className="mx-auto max-w-7xl px-5 md:px-10 py-10 md:py-14">
              <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[#111111] mb-8">
                Productos relacionados
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {relatedProducts.map((rp) => (
                  <ProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}