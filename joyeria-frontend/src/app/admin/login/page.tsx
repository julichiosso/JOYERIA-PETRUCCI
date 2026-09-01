"use client";

/**
 * app/admin/login/page.tsx
 * Página de login del panel admin.
 *
 * Mobile-first: inputs grandes, botón full-width, feedback claro de errores.
 * POST /auth/login → guarda accessToken + user en localStorage → redirect al admin.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken, setUser, isAuthenticated } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Si ya está autenticado, ir directo al panel
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/admin/productos");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error;
        if (res.status === 401) {
          setError("Email o contraseña incorrectos. Verificá los datos.");
        } else {
          setError(msg ?? `Error del servidor (${res.status}). Intentá de nuevo.`);
        }
        return;
      }

      const data = (await res.json()) as LoginResponse;
      setToken(data.accessToken);
      setUser(data.user);
      router.replace("/admin/productos");
    } catch {
      setError("No se pudo conectar con el servidor. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 py-10">

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-8 md:px-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display text-3xl tracking-[0.35em] text-gray-900 mb-1">
            PETRUCCI
          </p>
          <p className="font-body text-xs tracking-[0.15em] uppercase text-gray-400">
            Panel de administración
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="admin-email"
              className="font-body text-xs tracking-wide text-gray-700 font-medium"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-md font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 transition-colors"
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="admin-password"
              className="font-body text-xs tracking-wide text-gray-700 font-medium"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-md font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M1 1l16 16M7.5 7.57A2.5 2.5 0 0 0 11.43 11.5M6.65 3.28C7.4 3.1 8.2 3 9 3c4 0 7 4 7 6 0 .94-.35 1.9-.93 2.79M3.27 5.27C2.28 6.3 1.5 7.57 1.5 9c0 2 3 6 7.5 6a8 8 0 0 0 3.73-.93" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M1.5 9C1.5 7 4.5 3 9 3s7.5 4 7.5 6-3 6-7.5 6S1.5 11 1.5 9z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 mt-0.5 text-red-500">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <p className="font-body text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 bg-gray-900 text-white font-body text-sm tracking-[0.1em] rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2.5 mt-1"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        {/* Footer de la card */}
        <p className="text-center font-body text-xs text-gray-400 mt-6">
          ¿Problemas para ingresar?{" "}
          <a
            href="mailto:soporte@joyeriapetrucci.com.ar"
            className="text-amber-700 hover:underline"
          >
            Contactar soporte
          </a>
        </p>
      </div>

      <p className="mt-6 font-body text-xs text-gray-400">
        © {new Date().getFullYear()} Petrucci Joyería
      </p>
    </div>
  );
}
