/**
 * lib/featureFlags.ts
 * Sistema de Feature Flags y Modo Desarrollador para monetización y control de módulos.
 * Permite al desarrollador encender o apagar funcionalidades para el dueño del negocio.
 */

export interface FeatureFlags {
  metricsModule: boolean;        // Visible en el menú para el dueño
  inventoryValuation: boolean;   // Muestra valor total de catálogo ($ ARS)
  exportCsv: boolean;            // Permite exportar listado a Excel/CSV
  lowStockAlerts: boolean;       // Muestra alertas y reportes de reposición
  auditModule: boolean;          // Bitácora de auditoría y trazabilidad para el dueño
}

const FLAGS_STORAGE_KEY = "petrucci_feature_flags";
const DEV_MODE_KEY = "petrucci_dev_mode_active";

const DEFAULT_FLAGS: FeatureFlags = {
  metricsModule: false,
  inventoryValuation: false,
  exportCsv: false,
  lowStockAlerts: false,
  auditModule: false,
};

export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") return DEFAULT_FLAGS;
  try {
    const raw = localStorage.getItem(FLAGS_STORAGE_KEY);
    if (!raw) return DEFAULT_FLAGS;
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function setFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): void {
  if (typeof window === "undefined") return;
  const current = getFeatureFlags();
  const updated = { ...current, [key]: value };
  localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("petrucci_flags_changed", { detail: updated }));
}

export function isDevModeActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEV_MODE_KEY) === "true";
}

export function setDevMode(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(DEV_MODE_KEY, "true");
  } else {
    localStorage.removeItem(DEV_MODE_KEY);
  }
  window.dispatchEvent(new CustomEvent("petrucci_flags_changed"));
}
