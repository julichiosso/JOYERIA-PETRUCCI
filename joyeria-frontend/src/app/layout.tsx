import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import PWARegister from "@/components/ui/PWARegister";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://petruccijoyeria.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Petrucci Joyería — Artesanía en Metal y Tiempo",
    template: "%s | Petrucci Joyería",
  },
  description:
    "Joyería y relojería artesanal. Anillos, aros, cadenas, relojes de alta gama y piezas personalizadas en oro y plata. San Jorge, Santa Fe.",
  keywords: [
    "joyería",
    "relojería",
    "joyas oro 18k",
    "alianzas",
    "anillos de compromiso",
    "aros de oro",
    "cadenas de plata",
    "relojes casio",
    "relojes seiko",
    "trabajos personalizados",
    "petrucci joyería",
    "san jorge santa fe"
  ],
  authors: [{ name: "Petrucci Joyería" }],
  creator: "Petrucci Joyería",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Petrucci Joyería",
    title: "Petrucci Joyería — Artesanía en Metal y Tiempo",
    description:
      "Joyería y relojería artesanal. Anillos, aros, cadenas, relojes de alta gama y trabajos personalizados en oro y plata.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Petrucci Joyería y Relojería",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petrucci Joyería — Artesanía en Metal y Tiempo",
    description: "Joyería y relojería artesanal en oro, plata y alta relojería.",
  },
  icons: {
    icon: [
      { url: "/logo-petrucci-v2.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo-petrucci-v2.svg",
    apple: "/logo-petrucci-v2.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  "name": "Petrucci Joyería",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo-petrucci-v2.svg`,
  "image": `${SITE_URL}/og-image.jpg`,
  "description": "Joyería y relojería artesanal. Anillos, aros, cadenas, relojes de alta gama y trabajos personalizados en oro y plata.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "San Jorge",
    "addressRegion": "Santa Fe",
    "addressCountry": "AR",
  },
  "telephone": "+5493406419736",
  "priceRange": "$$",
  "currenciesAccepted": "ARS",
  "paymentAccepted": "Cash, Credit Card, Bank Transfer",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:30",
      "closes": "20:00",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${plusJakarta.variable} ${proximaNova.variable}`}
    >
      <head>
        <link rel="icon" href="/logo-petrucci-v2.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-petrucci-v2.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1D1D1F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Petrucci" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <PWARegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
