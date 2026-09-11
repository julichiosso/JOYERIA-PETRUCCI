"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const prefersReduced = useReducedMotion();
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Autofocus en el botón Cancelar para seguridad en acciones destructivas
        const timer = setTimeout(() => {
            cancelButtonRef.current?.focus();
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, isLoading, onCancel]);

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 },
        visible: prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
        exit: prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 },
    };

    const getVariantStyles = () => {
        switch (variant) {
            case "danger":
                return {
                    iconBg: "bg-red-100 text-red-700",
                    icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ),
                    confirmBtn: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
                };
            case "warning":
                return {
                    iconBg: "bg-amber-100 text-amber-800",
                    icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 4l9 16H3L12 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M12 10v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ),
                    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
                };
            case "info":
            default:
                return {
                    iconBg: "bg-gray-100 text-gray-800",
                    icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ),
                    confirmBtn: "bg-gray-900 hover:bg-amber-700 text-white focus:ring-gray-900",
                };
        }
    };

    const vStyles = getVariantStyles();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            if (!isLoading) onCancel();
                        }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        aria-hidden="true"
                    />

                    {/* Modal Container */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        aria-describedby="confirm-modal-description"
                        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/80 p-6 z-10 font-sans overflow-hidden"
                    >
                        <div className="flex items-start gap-4 font-sans">
                            <div className={`p-3 rounded-2xl shrink-0 ${vStyles.iconBg}`}>
                                {vStyles.icon}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5 font-sans">
                                <h3 id="confirm-modal-title" className="text-lg font-bold text-[#1D1D1F] leading-snug tracking-tight">
                                    {title}
                                </h3>
                                <p id="confirm-modal-description" className="mt-1.5 text-sm text-gray-500 font-medium leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 font-sans">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                disabled={isLoading}
                                onClick={onCancel}
                                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-semibold text-gray-700 bg-[#F5F5F7] hover:bg-gray-200 rounded-2xl transition-colors focus:outline-none disabled:opacity-50 cursor-pointer"
                            >
                                {cancelLabel}
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={onConfirm}
                                className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-2xl transition-all active:scale-[0.98] focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${vStyles.confirmBtn}`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                        Procesando...
                                    </>
                                ) : (
                                    confirmLabel
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
