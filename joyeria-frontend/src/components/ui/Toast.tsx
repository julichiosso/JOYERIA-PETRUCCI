"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useToast, ToastItem } from "@/hooks/useToast";

function ToastSingleItem({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
    const prefersReduced = useReducedMotion();

    const variants = {
        hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 },
        visible: prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 },
        exit: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 15, scale: 0.95 },
    };

    const getStyle = () => {
        switch (toast.type) {
            case "success":
                return {
                    bg: "bg-gray-900 text-white border-amber-500/30",
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-amber-400 shrink-0" aria-hidden="true">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ),
                };
            case "error":
                return {
                    bg: "bg-red-900 text-white border-red-500/30",
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-red-300 shrink-0" aria-hidden="true">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M5.5 5.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ),
                };
            case "undo":
                return {
                    bg: "bg-gray-900 text-white border-amber-500/40 shadow-xl",
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-amber-400 shrink-0" aria-hidden="true">
                            <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 3v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ),
                };
            case "info":
            default:
                return {
                    bg: "bg-gray-900 text-white border-gray-700",
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-blue-400 shrink-0" aria-hidden="true">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ),
                };
        }
    };

    const style = getStyle();

    return (
        <motion.div
            layout
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg border shadow-lg font-body text-sm ${style.bg}`}
        >
            <div className="flex items-center gap-3 min-w-0">
                {style.icon}
                <span className="truncate text-sm font-medium leading-tight">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {toast.type === "undo" && toast.onUndo && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.onUndo?.();
                            onClose(toast.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 rounded transition-colors"
                    >
                        Deshacer
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onClose(toast.id)}
                    aria-label="Cerrar notificación"
                    className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
}

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div
            aria-label="Notificaciones"
            className="fixed bottom-[84px] md:bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[60] flex flex-col gap-2.5 pointer-events-none"
        >
            <AnimatePresence mode="sync">
                {toasts.map((toast) => (
                    <ToastSingleItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
}
