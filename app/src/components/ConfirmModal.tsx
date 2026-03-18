"use client";

import { ReactNode, useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
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
      <div role="dialog" aria-modal="true" className="card w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        {children ? <div className="mt-3 text-sm text-slate-700">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <TxButton label="Cancel" variant="secondary" onClick={onCancel} />
          <TxButton label={confirmLabel} variant="danger" onClick={onConfirm} loading={confirmLoading} />
        </div>
      </div>
    </div>
  );
}
