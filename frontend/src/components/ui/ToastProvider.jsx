"use client";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = "success", durationMs = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (durationMs > 0) {
        setTimeout(() => dismiss(id), durationMs);
      }
    },
    [dismiss]
  );

  const api = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error", 5500),
    info: (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Floating Toast Stack (bottom-right) */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const styles =
            t.type === "error"
              ? "border-terracotta/40 bg-terracotta text-white"
              : t.type === "info"
              ? "border-primary/20 bg-primary text-white"
              : "border-accent/40 bg-primary text-white";

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-lg transition-all ${styles}`}
            >
              <span className="leading-relaxed">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}