"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Toast } from "@/components/Toast";

type ToastVariant = "success" | "error";

type ToastInput = {
  variant: ToastVariant;
  title: string;
  description?: string;
  linkHref?: string;
  linkLabel?: string;
  durationMs?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }
  }, []);

  const pushToast = useCallback(
    ({ durationMs = 4000, ...toast }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, ...toast }]);
      timeoutsRef.current[id] = window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast]
  );

  useEffect(() => {
    setMounted(true);
    return () => {
      Object.values(timeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = {};
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div aria-live="polite" role="status" className="pointer-events-none fixed right-4 top-4 z-[60] space-y-2">
              {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                  <Toast
                    id={toast.id}
                    variant={toast.variant}
                    title={toast.title}
                    description={toast.description}
                    linkHref={toast.linkHref}
                    linkLabel={toast.linkLabel}
                    onClose={removeToast}
                  />
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
