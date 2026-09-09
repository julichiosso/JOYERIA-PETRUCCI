import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const proximaNova = localFont({
  src: [
    {
      path: "../../proxima-nova/Proxima Nova/Proxima Nova Light/Proxima Nova Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../proxima-nova/Proxima Nova/Proxima Nova Regular/Proxima Nova Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../proxima-nova/Proxima Nova/Proxima Nova Semibold/Proxima Nova Semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../proxima-nova/Proxima Nova/Proxima Nova Extrabold/Proxima Nova Extrabold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../proxima-nova/Proxima Nova/Proxima Nova Black/Proxima Nova Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-proxima",
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
    <html
      lang="es"
      className={`${cormorant.variable} ${plusJakarta.variable} ${proximaNova.variable}`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
