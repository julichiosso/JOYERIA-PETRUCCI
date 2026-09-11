"use client";

/**
 * app/admin/layout.tsx
 * Layout exclusivo del panel admin.
 *
 * - NO incluye el Header/Footer públicos de la tienda
 * - Guard de autenticación: si no hay token → redirect a /admin/login
 * - Mobile-first: sidebar colapsable en desktop, bottom bar en mobile
 * - El dueño accede principalmente desde el celular para cargar productos
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearAuth, getUser } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

const NAV_ITEMS = [
  {
    label: "Productos",
    href: "/admin/productos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 5h14M3 10h10M3 15h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Config",
    href: "/admin/configuracion",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

function TopBar({ user }: { user: AdminUser | null }) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/admin/login");
  };

  return (
    <div className="h-16 bg-white border-b border-[#E8E4DE] flex items-center justify-between px-4 md:px-8 shrink-0">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 group"
        aria-label="Ver tienda pública"
      >
        <span className="font-serif text-xl font-medium tracking-[0.25em] text-gray-950 group-hover:text-amber-800 transition-colors uppercase">
          Petrucci
        </span>
        <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-amber-800/80 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
          Admin
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Acceso directo mobile: Cargar Joya */}
        <Link
          href="/admin/productos/nuevo"
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-black !text-white text-xs font-extrabold uppercase rounded-lg shadow-sm active:scale-95 cursor-pointer"
        >
          <span className="!text-white">➕ CARGAR JOYA</span>
        </Link>

        {user && (
          <span className="hidden md:block font-sans text-xs text-gray-500 tracking-wide">
            Administrador <strong className="text-gray-900 font-semibold">{user.name}</strong>
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 font-sans text-xs text-gray-500 hover:text-red-700 transition-colors px-2 py-1 rounded cursor-pointer"
          aria-label="Cerrar sesión"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M6 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4M10 10l3-3-3-3M14 7.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden md:inline font-medium">Salir</span>
        </button>
      </div>
    </div>
  );
}

function SidebarDesktop({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#E8E4DE] shrink-0">
      <nav className="flex-1 py-8 px-3" aria-label="Navegación Admin">
        <p className="font-serif text-[11px] tracking-[0.2em] uppercase text-gray-400 px-3 mb-4 font-semibold">
          Menú Principal
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md font-sans text-xs tracking-wide transition-all",
                    active
                      ? "border-l-2 border-amber-800 bg-amber-50/50 text-amber-950 font-semibold pl-2.5"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-950 font-medium"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={active ? "text-amber-800" : "text-gray-400"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Link a la tienda */}
      <div className="p-4 border-t border-[#E8E4DE]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 font-sans text-xs text-gray-500 hover:text-amber-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M6 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8M9 1h4v4M13 1l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver tienda pública ↗
        </Link>
      </div>
    </aside>
  );
}

function BottomBarMobile({ pathname }: { pathname: string }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      aria-label="Navegación mobile admin"
    >
      <ul className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 transition-colors w-full",
                  active ? "text-amber-700" : "text-gray-400 hover:text-gray-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="font-body text-[9px] tracking-wide">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Guard: si no hay token y no estamos en /admin/login, redirigir
    if (!isAuthenticated() && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }
    setUser(getUser());
    setChecking(false);
  }, [pathname, router]);

  // Si estamos en la página de login, renderizar solo los children
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Pantalla de carga mientras verifica auth
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Topbar */}
        <TopBar user={user} />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar desktop */}
          <SidebarDesktop pathname={pathname} />

          {/* Contenido principal */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom bar mobile */}
        <BottomBarMobile pathname={pathname} />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}
