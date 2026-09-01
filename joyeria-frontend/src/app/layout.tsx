import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/ui/WhatsAppFAB";
import CookieBanner from "@/components/ui/CookieBanner";

// ─── Fuentes (self-hosted por Next.js — no hay request externo en runtime) ───
// Cormorant Garamond: para títulos, nombres de productos, h1–h6
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  // Pesos usados en el diseño:
  // 300 = elegante para subtítulos largos
  // 400 = display normal
  // 500 = énfasis en precios o nombres de producto
  // 600 = títulos principales (hero)
  weight: ["300", "400", "500", "600"],
  display: "swap", // Lighthouse: evita FOIT (flash of invisible text)
});

// Inter: para navegación, precios, botones, cuerpo de texto UI
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Pesos usados en el diseño:
  // 300 = metadata secundaria (categoría sobre el nombre)
  // 400 = texto de cuerpo, párrafos
  // 500 = labels, nav items
  // 600 = precio destacado, botones
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// ─── Metadatos globales (se sobreescriben por página con generateMetadata) ──
export const metadata: Metadata = {
  title: {
    default: "Petrucci Joyería — Artesanía en Metal y Tiempo",
    template: "%s | Petrucci Joyería",
  },
  description:
    "Joyería y relojería artesanal. Anillos, aros, cadenas, relojes y trabajos personalizados. Consultá por WhatsApp.",
  keywords: ["joyería", "relojería", "artesanal", "anillos", "joyas", "petrucci"],
  authors: [{ name: "Petrucci Joyería" }],
  creator: "Petrucci Joyería",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Petrucci Joyería",
    title: "Petrucci Joyería — Artesanía en Metal y Tiempo",
    description:
      "Joyería y relojería artesanal. Anillos, aros, cadenas, relojes y trabajos personalizados.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        {/*
          WhatsAppFAB: href={null} mientras el backend no tenga GET /catalog/whatsapp-link.
          Cuando el endpoint exista:
            1. Importar getGeneralWhatsAppLink desde @/lib/whatsapp
            2. Llamarlo aquí (layout es Server Component, puede hacer fetch)
            3. Pasar el resultado como href={waLink}
        */}
        <WhatsAppFAB href={null} />
        <CookieBanner />
      </body>
    </html>
  );
}
