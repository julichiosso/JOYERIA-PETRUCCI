"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItemWithSubmenu {
  id: string;
  label: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: SubMenuItem[];
}

const JOYAS_SUBMENU: MenuItemWithSubmenu = {
  id: "joyas",
  label: "Joyas",
  viewAllHref: "/joyeria",
  viewAllLabel: "Ver todas las Joyas",
  items: [
    { label: "Anillos", href: "/joyeria/anillos-2" },
    { label: "Aros y Aritos", href: "/joyeria/aros" },
    { label: "Cadenas y Gargantillas", href: "/joyeria/gargantillas" },
    { label: "Dijes y Colgantes", href: "/joyeria/dijes" },
    { label: "Pulseras", href: "/joyeria/pulseras" },
    { label: "Pulseras Bebé", href: "/joyeria/pulseras-bebe" },
    { label: "Trabajos Personalizados", href: "/trabajos-personalizados" },
  ],
};

const RELOJES_SUBMENU: MenuItemWithSubmenu = {
  id: "relojes",
  label: "Relojes",
  viewAllHref: "/relojes",
  viewAllLabel: "Ver todos los Relojes",
  items: [
    { label: "Casio & Catterpillar", href: "/relojes" },
    { label: "Seiko & Orient", href: "/relojes" },
    { label: "Tommy Hilfiger", href: "/relojes" },
    { label: "Tressa & Smarts", href: "/relojes" },
  ],
};

const DIRECT_LINKS = [
  { label: "Personalizados", href: "/trabajos-personalizados" },
  { label: "Marroquinería", href: "/marroquineria" },
  { label: "Mates", href: "/mates" },
  { label: "Quiénes Somos", href: "/nosotros" },
  { label: "Contacto", href: "/nosotros#contacto" },
];

export default function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Auto-expand active section when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (pathname.startsWith("/joyeria")) {
        setExpandedSection("joyas");
      } else if (pathname.startsWith("/relojes")) {
        setExpandedSection("relojes");
      }
    }
  }, [isOpen, pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop oscuro con fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panel Lateral Slide-over */}
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
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Lista scrollable de enlaces y acordeones */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-100">
              <nav aria-label="Categorías principales">
                <ul className="text-[14px]">
                  {/* Acordeón JOYAS */}
                  <li>
                    <button
                      type="button"
                      onClick={() => toggleSection(JOYAS_SUBMENU.id)}
                      aria-expanded={expandedSection === JOYAS_SUBMENU.id}
                      className="w-full flex items-center justify-between px-5 py-3.5 font-medium text-left text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span className={cn(
                        "transition-colors",
                        expandedSection === JOYAS_SUBMENU.id ? "font-semibold text-black" : "text-gray-900"
                      )}>
                        {JOYAS_SUBMENU.label}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={cn(
                          "text-gray-400 transition-transform duration-200",
                          expandedSection === JOYAS_SUBMENU.id ? "rotate-90 text-black" : ""
                        )}
                      >
                        <path
                          d="M6 3L11 8L6 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {expandedSection === JOYAS_SUBMENU.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50/80 border-y border-gray-100 px-5 py-2.5 overflow-hidden"
                        >
                          <ul className="space-y-1 text-[13px] text-gray-600">
                            {/* Primer link: Ver todas las Joyas */}
                            <li>
                              <Link
                                href={JOYAS_SUBMENU.viewAllHref}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-black font-semibold tracking-tight hover:underline border-b border-gray-200/60 mb-1"
                              >
                                <span>{JOYAS_SUBMENU.viewAllLabel}</span>
                                <span className="text-gray-400 text-xs">→</span>
                              </Link>
                            </li>
                            {JOYAS_SUBMENU.items.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className="block py-1.5 hover:text-black transition-colors"
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Acordeón RELOJES */}
                  <li>
                    <button
                      type="button"
                      onClick={() => toggleSection(RELOJES_SUBMENU.id)}
                      aria-expanded={expandedSection === RELOJES_SUBMENU.id}
                      className="w-full flex items-center justify-between px-5 py-3.5 font-medium text-left text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span className={cn(
                        "transition-colors",
                        expandedSection === RELOJES_SUBMENU.id ? "font-semibold text-black" : "text-gray-900"
                      )}>
                        {RELOJES_SUBMENU.label}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={cn(
                          "text-gray-400 transition-transform duration-200",
                          expandedSection === RELOJES_SUBMENU.id ? "rotate-90 text-black" : ""
                        )}
                      >
                        <path
                          d="M6 3L11 8L6 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {expandedSection === RELOJES_SUBMENU.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50/80 border-y border-gray-100 px-5 py-2.5 overflow-hidden"
                        >
                          <ul className="space-y-1 text-[13px] text-gray-600">
                            {/* Primer link: Ver todos los Relojes */}
                            <li>
                              <Link
                                href={RELOJES_SUBMENU.viewAllHref}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-black font-semibold tracking-tight hover:underline border-b border-gray-200/60 mb-1"
                              >
                                <span>{RELOJES_SUBMENU.viewAllLabel}</span>
                                <span className="text-gray-400 text-xs">→</span>
                              </Link>
                            </li>
                            {RELOJES_SUBMENU.items.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className="block py-1.5 hover:text-black transition-colors"
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Links directos */}
                  {DIRECT_LINKS.map((link) => (
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

            {/* Footer del Drawer */}
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
                  <path
                    d="M2 15.5c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
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
