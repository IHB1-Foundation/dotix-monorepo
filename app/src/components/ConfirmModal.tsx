"use client";

import { ReactNode, useEffect, useRef } from "react";

import { TxButton } from "@/components/TxButton";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmLoading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus first focusable element when modal opens
    const firstFocusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      // Focus trap — keep Tab cycling within the modal
      if (event.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="card w-full max-w-lg p-5">
        <h3 id="confirm-modal-title" className="text-lg font-semibold text-ink dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        {children ? <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <TxButton label="Cancel" variant="secondary" onClick={onCancel} />
          <TxButton label={confirmLabel} variant="danger" onClick={onConfirm} loading={confirmLoading} />
        </div>
      </div>
    </div>
  );
}
