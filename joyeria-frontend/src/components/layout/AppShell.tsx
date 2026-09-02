"use client";

/**
 * components/layout/AppShell.tsx
 *
 * Separa completamente el diseño de la tienda pública del panel de administración:
 *  - En /admin/*: Renderiza únicamente el layout de administración (sin header público, sin footer público, sin FAB de WhatsApp).
 *  - En la tienda pública: Renderiza Header, Footer, WhatsAppFAB y CookieBanner.
 */

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFAB from "@/components/ui/WhatsAppFAB";
import CookieBanner from "@/components/ui/CookieBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFAB href={null} />
      <CookieBanner />
    </>
  );
}
