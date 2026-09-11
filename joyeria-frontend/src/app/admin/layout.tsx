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
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-4 md:px-8 shrink-0">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2 group"
        aria-label="Ver tienda pública"
      >
        <span className="font-sans text-lg md:text-xl font-bold tracking-tight text-[#1D1D1F] uppercase">
          Petrucci
        </span>
        <span className="text-xs font-sans font-medium uppercase tracking-widest text-gray-400">
          / Admin
        </span>
      </Link>

      <div className="flex items-center gap-3 font-sans">
        {user && (
          <span className="hidden md:block text-xs text-gray-500 font-medium">
            Víctor
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1D1D1F] transition-colors px-2 py-1 rounded cursor-pointer font-medium"
          aria-label="Cerrar sesión"
        >
          <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true">
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
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200/80 shrink-0">
      <nav className="flex-1 py-6 px-3" aria-label="Navegación Admin">
        <p className="font-sans text-[11px] tracking-wider uppercase text-gray-400 px-3 mb-3 font-semibold">
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
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-sans text-xs font-semibold tracking-tight transition-all",
                    active
                      ? "bg-[#007AFF]/10 text-[#007AFF]"
                      : "text-gray-600 hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={active ? "text-[#007AFF]" : "text-gray-400"}>
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
      <div className="p-4 border-t border-gray-200/80">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 font-sans text-xs text-gray-500 hover:text-[#007AFF] transition-colors"
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200/80"
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
                  active ? "text-[#007AFF]" : "text-gray-400 hover:text-gray-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="font-sans text-[10px] font-semibold tracking-tight">{item.label}</span>
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
    if (!isAuthenticated() && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }
    setUser(getUser());
    setChecking(false);
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
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
