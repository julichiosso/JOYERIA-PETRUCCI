"use client";

/**
 * components/layout/MobileMenuDrawer.tsx
 * Menú lateral móvil con acordeones dinámicos por categoría.
 * Recibe `categories` del servidor — lo que Víctor cargue aparece al instante.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

// Links estáticos que siempre aparecen al final
const STATIC_LINKS = [
  { label: "Quiénes Somos", href: "/nosotros" },
  { label: "Contacto", href: "/nosotros#contacto" },
];

export default function MobileMenuDrawer({ isOpen, onClose, categories }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Categorías raíz activas
  const rootCategories = categories.filter((c) => !c.parent && c.isActive !== false);

  // Auto-expandir la sección activa al abrir
  useEffect(() => {
    if (isOpen) {
      const active = rootCategories.find((cat) => pathname.startsWith(`/${cat.slug}`));
      if (active) setExpandedSection(active.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      className={cn("text-gray-400 transition-transform duration-200", expanded ? "rotate-90 text-black" : "")}
    >
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panel lateral */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 bottom-0 w-[84%] max-w-[340px] bg-white z-50 md:hidden flex flex-col shadow-2xl overflow-hidden font-body text-gray-900"
            aria-label="Menú de navegación mobile"
          >
            {/* Header del menú */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <span className="font-body text-xs font-bold tracking-[0.18em] uppercase text-gray-400">
                Menú
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Lista de navegación */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-100">
              <nav aria-label="Categorías principales">
                <ul className="text-[14px]">
                  {rootCategories.map((cat) => {
                    const activeChildren = cat.children?.filter((c) => c.isActive !== false) ?? [];
                    const hasChildren = activeChildren.length > 0;
                    const isExpanded = expandedSection === cat.id;

                    if (hasChildren) {
                      return (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => toggleSection(cat.id)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between px-5 py-3.5 font-medium text-left text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <span className={cn("transition-colors", isExpanded ? "font-semibold text-black" : "text-gray-900")}>
                              {cat.name}
                            </span>
                            <ChevronIcon expanded={isExpanded} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-gray-50/80 border-y border-gray-100 px-5 py-2.5 overflow-hidden"
                              >
                                <ul className="space-y-1 text-[13px] text-gray-600">
                                  {/* Ver todo */}
                                  <li>
                                    <Link
                                      href={`/${cat.slug}`}
                                      onClick={onClose}
                                      className="flex items-center justify-between py-2 text-black font-semibold tracking-tight hover:underline border-b border-gray-200/60 mb-1"
                                    >
                                      <span>Ver todo en {cat.name}</span>
                                      <span className="text-gray-400 text-xs">→</span>
                                    </Link>
                                  </li>
                                  {activeChildren.map((sub) => (
                                    <li key={sub.id}>
                                      <Link
                                        href={`/${cat.slug}/${sub.slug}`}
                                        onClick={onClose}
                                        className="block py-1.5 hover:text-black transition-colors"
                                      >
                                        {sub.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    }

                    // Categoría sin hijos — link directo
                    return (
                      <li key={cat.id}>
                        <Link
                          href={`/${cat.slug}`}
                          onClick={onClose}
                          className={cn(
                            "block px-5 py-3.5 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors",
                            pathname.startsWith(`/${cat.slug}`) ? "text-black font-semibold" : "text-gray-900"
                          )}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    );
                  })}

                  {/* Links estáticos */}
                  {STATIC_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "block px-5 py-3.5 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors",
                          pathname === link.href ? "text-black font-semibold" : "text-gray-900"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Footer del drawer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex flex-col gap-3">
              <a
                href="https://wa.me/5493406419736?text=Hola%20Petrucci,%20quisiera%20hacer%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.522 5.839L.057 23.776a.5.5 0 0 0 .617.625l6.09-1.595A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.74-.518-5.297-1.424l-.38-.224-3.938 1.032 1.05-3.834-.247-.395A9.948 9.948 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                <span>WhatsApp de Atención</span>
              </a>

              <Link
                href="/admin/login"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-black transition-colors flex items-center justify-center gap-2 py-1"
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>Panel de Administración</span>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
