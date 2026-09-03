import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dominios remotos de donde vienen las imágenes del catálogo.
    // El backend sube a Supabase Storage — hay que agregar el dominio de Supabase.
    // IMPORTANTE: cuando tengamos el dominio de producción del backend, agregarlo acá también.
    remotePatterns: [
      {
        protocol: "https",
        // Reemplazar con el dominio real de Supabase Storage del proyecto
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Desarrollo local — imágenes servidas por el backend en localhost
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
    ],
    // Formatos modernos: Next.js convierte automáticamente a AVIF/WebP
    formats: ["image/avif", "image/webp"],
    qualities: [60, 65, 80, 85, 92],
  },

  // Encabezados de seguridad HTTP (Lighthouse Best Practices)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
