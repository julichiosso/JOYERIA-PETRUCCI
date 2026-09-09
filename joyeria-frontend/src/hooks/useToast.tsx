"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "undo";

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    onUndo?: () => void;
    duration?: number;
}

interface ToastContextValue {
    toasts: ToastItem[];
    addToast: (toast: Omit<ToastItem, "id">) => string;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    undo: (message: string, onUndo: () => void, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        ({ type, message, onUndo, duration }: Omit<ToastItem, "id">) => {
            const id = Math.random().toString(36).substring(2, 9);
            const defaultDuration = type === "undo" ? 8000 : 5000;
            const itemDuration = duration ?? defaultDuration;

            const newToast: ToastItem = {
                id,
                type,
                message,
                onUndo,
                duration: itemDuration,
            };

            setToasts((prev) => [...prev.slice(-2), newToast]); // Mantener máximo 3 toasts activos

            if (itemDuration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, itemDuration);
            }

            return id;
        },
        [removeToast]
    );

    const success = useCallback(
        (message: string, duration?: number) => addToast({ type: "success", message, duration }),
        [addToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => addToast({ type: "error", message, duration }),
        [addToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => addToast({ type: "info", message, duration }),
        [addToast]
    );

    const undo = useCallback(
        (message: string, onUndo: () => void, duration?: number) =>
            addToast({ type: "undo", message, onUndo, duration }),
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{
                toasts,
                addToast,
                removeToast,
                success,
                error,
                info,
                undo,
            }}
        >
            {children}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast debe ser usado dentro de un ToastProvider");
    }
    return context;
}
