/**
 * lib/whatsapp.ts
 * Helper centralizado para links de WhatsApp generales (no de producto).
 *
 * SITUACIÓN ACTUAL:
 *  - El backend NO expone el número de WhatsApp en /catalog/store-config
 *    por decisión de seguridad (campo whatsappNumber es privado).
 *  - Se pide al backend un nuevo endpoint GET /catalog/whatsapp-link que
 *    devuelva un link wa.me ya armado con el mensaje default de la tienda.
 *
 * MIENTRAS EL ENDPOINT NO EXISTE:
 *  - getGeneralWhatsAppLink() devuelve null.
 *  - Todos los componentes que usan este helper muestran el botón deshabilitado
 *    o lo omiten silenciosamente.
 *
 * CUANDO EL ENDPOINT ESTÉ LISTO:
 *  1. El backend implementa GET /catalog/whatsapp-link → { url: string }
 *  2. Descomentar la llamada a la API en getGeneralWhatsAppLink()
 *  3. Agregar el método al cliente api.ts
 *  4. Los componentes que usan este helper funcionarán automáticamente.
 *
 * Los links de WhatsApp POR PRODUCTO no pasan por aquí —
 * usan product.whatsappLink que ya devuelve GET /catalog/products/:slug.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface WhatsAppLinkResponse {
  url: string;
}

/**
 * Obtiene el link de WhatsApp general de la tienda desde el backend.
 * Devuelve null si el endpoint aún no está disponible o si falla.
 *
 * Usar en Server Components (fetch en servidor).
 */
export async function getGeneralWhatsAppLink(): Promise<string | null> {
  // TODO: descomentar cuando el backend tenga GET /catalog/whatsapp-link
  /*
  try {
    const res = await fetch(`${API_BASE_URL}/catalog/whatsapp-link`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as WhatsAppLinkResponse;
    return data.url ?? null;
  } catch {
    return null;
  }
  */

  // Mientras el endpoint no exista, retornar null.
  // Cuando esté listo, eliminar esta línea y descomentar el bloque de arriba.
  void API_BASE_URL; // evita el warning de variable no usada
  return null;
}
