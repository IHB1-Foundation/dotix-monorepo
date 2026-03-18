"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/components/ToastProvider";
import { explorerTxUrl } from "@/lib/network";

type Props = {
  hash?: string;
  isPending?: boolean;
  isConfirmed?: boolean;
  error?: string;
};

export function TxStatus({ hash, isPending, isConfirmed, error }: Props) {
  const { pushToast } = useToast();
  const shownSuccessRef = useRef<string | null>(null);
  const shownErrorRef = useRef<string | null>(null);

  if (!hash && !error) {
    return null;
  }

  const link = hash ? explorerTxUrl(hash) : undefined;

  useEffect(() => {
    if (!isConfirmed || !hash) return;

    if (shownSuccessRef.current === hash) {
      return;
    }

    shownSuccessRef.current = hash;
    pushToast({
      variant: "success",
      title: "Transaction Confirmed",
      description: "Your transaction was successfully included on-chain.",
      linkHref: link,
      linkLabel: "View on Blockscout",
    });
  }, [hash, isConfirmed, link, pushToast]);

  useEffect(() => {
    if (!error) return;

    const errorKey = hash ? `${hash}:${error}` : error;
    if (shownErrorRef.current === errorKey) {
      return;
    }

    shownErrorRef.current = errorKey;
    pushToast({
      variant: "error",
      title: "Transaction Failed",
      description: error,
    });
  }, [error, hash, pushToast]);

  return (
    <div className="mt-2 space-y-2 text-sm">
      {isPending && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
          <p>Transaction submitted...</p>
        </div>
      )}
      {isConfirmed && (
        <div className="flex items-start gap-2 rounded-lg bg-mint/10 px-3 py-2 text-mint">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <p>
            Confirmed!{" "}
            {link ? (
              <a className="underline" href={link} target="_blank" rel="noreferrer">
                View on Blockscout
              </a>
            ) : null}
          </p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.8-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          <p>{error}</p>
        </div>
      )}
      {!isPending && !isConfirmed && hash && link && (
        <p>
          <a className="underline text-slate-600" href={link} target="_blank" rel="noreferrer">
            View transaction
          </a>
        </p>
      )}
    </div>
  );
}
