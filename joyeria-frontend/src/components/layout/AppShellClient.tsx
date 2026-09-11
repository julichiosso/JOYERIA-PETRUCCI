"use client";

/**
 * components/layout/AppShellClient.tsx
 *
 * Client wrapper: detecta si estamos en /admin (no renderiza header/footer público)
 * o en la tienda pública (renderiza Header, Footer, FAB y CookieBanner).
 * Recibe `categories` como prop desde el Server Component AppShell
 * para que el Header pueda construir la navegación dinámicamente.
 */

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFAB from "@/components/ui/WhatsAppFAB";
import CookieBanner from "@/components/ui/CookieBanner";
import type { Category } from "@/types/category";

interface AppShellClientProps {
  children: React.ReactNode;
  categories: Category[];
}

export default function AppShellClient({ children, categories }: AppShellClientProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header categories={categories} />
      <main>{children}</main>
      <Footer />
      <WhatsAppFAB href={null} />
      <CookieBanner />
    </>
  );
}
