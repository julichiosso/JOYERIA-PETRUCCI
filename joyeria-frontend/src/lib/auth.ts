/**
 * lib/auth.ts
 * Helpers de autenticación para el panel admin.
 *
 * Estrategia: JWT en localStorage (cliente) — no en cookies httpOnly porque
 * el backend actual no setea la cookie desde el servidor.
 * Si en el futuro el backend setea cookies httpOnly, esta capa se puede
 * reemplazar sin cambiar los componentes que la usan.
 *
 * Solo se importa desde Client Components (usa localStorage → solo browser).
 */

const TOKEN_KEY = "petrucci_admin_token";
const USER_KEY = "petrucci_admin_user";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
}

// ─── Token ────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setUser(user: AdminUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Fetch autenticado para el admin ─────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * adminFetch — wrapper de fetch que agrega el header Authorization automáticamente.
 * Lanza AdminApiError(401) si el token expiró (para que el guard redirija al login).
 */
export async function adminFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    clearAuth();
    throw new AdminApiError(401, "Sesión expirada. Iniciá sesión nuevamente.");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = (body as { error?: string }).error ?? message;
    } catch {
      // mantiene el mensaje de status
    }
    throw new AdminApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

/**
 * adminFetchMultipart — para subir archivos (sin Content-Type: application/json).
 */
export async function adminFetchMultipart<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO poner Content-Type — el browser lo setea solo con el boundary correcto
    },
    body: formData,
    cache: "no-store",
  });

  if (res.status === 401) {
    clearAuth();
    throw new AdminApiError(401, "Sesión expirada. Iniciá sesión nuevamente.");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = (body as { error?: string }).error ?? message;
    } catch {}
    throw new AdminApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
