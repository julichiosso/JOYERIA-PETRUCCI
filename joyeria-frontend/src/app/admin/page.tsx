import { redirect } from "next/navigation";

/**
 * app/admin/page.tsx
 * La raíz /admin redirige a /admin/productos.
 */
export default function AdminRootPage() {
  redirect("/admin/productos");
}
