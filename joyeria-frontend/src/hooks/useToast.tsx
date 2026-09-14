"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "undo";

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    onUndo?: () => void;
    duration?: number;
}

export interface ToastActions {
    addToast: (toast: Omit<ToastItem, "id">) => string;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    undo: (message: string, onUndo: () => void, duration?: number) => string;
}

export interface ToastContextValue extends ToastActions {
    toasts?: ToastItem[];
}

const ToastStateContext = createContext<ToastItem[]>([]);
const ToastActionsContext = createContext<ToastActions | null>(null);

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

            setToasts((prev) => [...prev.slice(-2), newToast]);

            if (itemDuration > 0) {
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                }, itemDuration);
            }

            return id;
        },
        []
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

    const actions = useMemo<ToastActions>(
        () => ({
            addToast,
            removeToast,
            success,
            error,
            info,
            undo,
        }),
        [addToast, removeToast, success, error, info, undo]
    );

    return (
        <ToastActionsContext.Provider value={actions}>
            <ToastStateContext.Provider value={toasts}>
                {children}
            </ToastStateContext.Provider>
        </ToastActionsContext.Provider>
    );
}

/**
 * useToast: devuelve acciones estables (success, error, info, undo, addToast, removeToast)
 * cuya referencia NUNCA cambia al actualizar el estado de toasts, evitando re-renders infinitos.
 */
export function useToast(): ToastActions {
    const actions = useContext(ToastActionsContext);
    if (!actions) {
        throw new Error("useToast debe ser usado dentro de un ToastProvider");
    }
    return actions;
}

/**
 * useToastList: hook exclusivo para el contenedor visual de toasts.
 */
export function useToastList(): ToastItem[] {
    return useContext(ToastStateContext);
}
