import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
