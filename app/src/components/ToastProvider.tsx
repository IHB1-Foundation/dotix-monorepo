"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Toast, ToastVariant } from "@/components/Toast";

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
  pushToast: (toast: ToastInput) => string;
  updateToast: (id: string, update: Partial<ToastInput>) => void;
  removeToast: (id: string) => void;
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

  const scheduleRemoval = useCallback(
    (id: string, durationMs: number) => {
      if (timeoutsRef.current[id]) window.clearTimeout(timeoutsRef.current[id]);
      timeoutsRef.current[id] = window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast]
  );

  const pushToast = useCallback(
    ({ durationMs, ...toast }: ToastInput): string => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, durationMs, ...toast }]);
      // tx-pending stays until explicitly updated/removed
      if (toast.variant !== "tx-pending") {
        scheduleRemoval(id, durationMs ?? 4000);
      }
      return id;
    },
    [scheduleRemoval]
  );

  const updateToast = useCallback(
    (id: string, update: Partial<ToastInput>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...update } : t))
      );
      // auto-dismiss after transition to confirmed/success/error
      if (update.variant && update.variant !== "tx-pending") {
        scheduleRemoval(id, update.durationMs ?? 5000);
      }
    },
    [scheduleRemoval]
  );

  useEffect(() => {
    setMounted(true);
    return () => {
      Object.values(timeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = {};
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ pushToast, updateToast, removeToast }),
    [pushToast, updateToast, removeToast]
  );

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
