"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";
type ToastValue = { message: string; tone: ToastTone } | null;
type ToastContextValue = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ToastContextValue>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastValue>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, tone: ToastTone = "info") => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setToast({ message, tone });
        timeoutRef.current = setTimeout(() => setToast(null), 4200);
    }, []);

    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const toneClasses = toast?.tone === "success"
        ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
        : toast?.tone === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-primary/30 bg-white text-textMainLight dark:bg-cardDark dark:text-textMainDark";

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[10000] w-[min(24rem,calc(100vw-2rem))]" aria-live="polite" aria-atomic="true">
                {toast && (
                    <div
                        role={toast.tone === "error" ? "alert" : "status"}
                        className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur ${toneClasses}`}
                    >
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() => setToast(null)}
                            className="text-current opacity-70 hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
