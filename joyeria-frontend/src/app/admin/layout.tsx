"use client";

/**
 * app/admin/layout.tsx
 * Layout exclusivo del panel admin.
 *
 * - Guard de autenticación: si no hay token → redirect a /admin/login
 * - Navegación minimalista estilo Apple
 * - Control de acceso: Víctor solo ve Productos, Categorías y Config.
 * - Métricas & Consultas solo se muestran a webya@joyeriapetrucci.com, modo dev o si el módulo está habilitado.
 */

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearAuth, getUser } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { getFeatureFlags, isDevModeActive, setDevMode } from "@/lib/featureFlags";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const BASE_NAV_ITEMS: NavItem[] = [
  {
    label: "Productos",
    href: "/admin/productos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 5h14M3 10h10M3 15h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Ajustes",
    href: "/admin/configuracion",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const METRICS_NAV_ITEM: NavItem = {
  label: "Métricas",
  href: "/admin/metricas",
  icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 17V11M7.5 17V6M12 17V9M16.5 17V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

function TopBar({
  user,
  devMode,
  onDevClick,
}: {
  user: AdminUser | null;
  devMode: boolean;
  onDevClick: () => void;
}) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/admin/login");
  };

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA] flex items-center justify-between px-4 md:px-7 shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDevClick}
          className="flex items-center gap-2 group cursor-pointer text-left select-none"
          title="Panel de Administración"
        >
          <span className="font-sans text-base md:text-lg font-semibold tracking-tight text-[#1D1D1F] uppercase">
            Petrucci
          </span>
          <span className="text-[11px] font-sans font-medium uppercase tracking-widest text-[#86868B] group-hover:text-[#1D1D1F] transition-colors">
            / Admin
          </span>
        </button>

        {devMode && (
          <Link
            href="/admin/metricas"
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-md text-[10px] font-semibold text-[#007AFF] tracking-wider uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
            <span>Desarrollador</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 font-sans">
        {user && (
          <span className="hidden md:block text-xs text-[#86868B] font-medium">
            {user.name || "Usuario"}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors px-2 py-1 rounded cursor-pointer font-medium"
          aria-label="Cerrar sesión"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M6 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4M10 10l3-3-3-3M14 7.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}

function SidebarDesktop({ pathname, navItems }: { pathname: string; navItems: NavItem[] }) {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#E5E5EA] shrink-0">
      <nav className="flex-1 py-5 px-3" aria-label="Navegación Admin">
        <p className="font-sans text-[10px] tracking-wider uppercase text-[#86868B] px-3 mb-2.5 font-medium">
          Menú
        </p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl font-sans text-xs font-medium tracking-tight transition-all select-none",
                    active
                      ? "bg-[#007AFF]/10 text-[#007AFF]"
                      : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={active ? "text-[#007AFF]" : "text-[#86868B]"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Link a la tienda pública */}
      <div className="p-3 border-t border-[#E5E5EA]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 font-sans text-xs text-[#86868B] hover:text-[#007AFF] transition-colors rounded-lg"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M6 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8M9 1h4v4M13 1l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver tienda ↗
        </Link>
      </div>
    </aside>
  );
}

function BottomBarMobile({ pathname, navItems }: { pathname: string; navItems: NavItem[] }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E5EA]"
      aria-label="Navegación mobile admin"
    >
      <ul className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 transition-colors w-full",
                  active ? "text-[#007AFF]" : "text-[#86868B] hover:text-[#1D1D1F]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="font-sans text-[10px] font-medium tracking-tight">{item.label}</span>
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
  const [devMode, setDevState] = useState(false);
  const [features, setFeatures] = useState(getFeatureFlags());
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated() && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }
    const currentUser = getUser();
    setUser(currentUser);
    setChecking(false);

    const isDev = isDevModeActive() || currentUser?.email === "webya@joyeriapetrucci.com";
    setDevState(isDev);
    setFeatures(getFeatureFlags());

    const updateState = () => {
      const u = getUser();
      setDevState(isDevModeActive() || u?.email === "webya@joyeriapetrucci.com");
      setFeatures(getFeatureFlags());
    };

    window.addEventListener("petrucci_flags_changed", updateState);
    return () => window.removeEventListener("petrucci_flags_changed", updateState);
  }, [pathname, router]);

  // Atajo de teclado Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        const next = !isDevModeActive();
        setDevMode(next);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      setClickCount(0);
      const next = !devMode;
      setDevMode(next);
    } else {
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  const navItems = useMemo(() => {
    const items = [...BASE_NAV_ITEMS];
    const isDev = devMode || user?.email === "webya@joyeriapetrucci.com";

    // Si es desarrollador o si Víctor tiene contratado Métricas o Auditoría, agregar al menú
    if (isDev || features.metricsModule || features.auditModule) {
      const label = features.metricsModule && features.auditModule
        ? "Métricas & Auditoría"
        : features.auditModule
        ? "Auditoría"
        : "Métricas";

      const href = !features.metricsModule && features.auditModule
        ? "/admin/metricas?tab=auditoria"
        : "/admin/metricas";

      items.splice(2, 0, {
        label,
        href,
        icon: (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 17V11M7.5 17V6M12 17V9M16.5 17V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      });
    }

    return items;
  }, [features, devMode, user]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
        <TopBar
          user={user}
          devMode={devMode || user?.email === "webya@joyeriapetrucci.com"}
          onDevClick={handleLogoClick}
        />

        <div className="flex flex-1 overflow-hidden">
          <SidebarDesktop pathname={pathname} navItems={navItems} />

          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-8">
              {children}
            </div>
          </main>
        </div>

        <BottomBarMobile pathname={pathname} navItems={navItems} />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}
