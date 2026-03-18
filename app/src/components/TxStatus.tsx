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
    <div className="mt-2 text-sm">
      {isPending && <p className="text-slate-600">Transaction submitted...</p>}
      {isConfirmed && (
        <p className="text-mint">
          Confirmed! {link ? <a className="underline" href={link} target="_blank" rel="noreferrer">View on Blockscout</a> : null}
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
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
