"use client";

import { useState } from "react";

type CopyableAddressProps = {
  address: string;
  short?: boolean;
  className?: string;
};

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CopyableAddress({ address, short = true, className = "" }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={`group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 ${copied ? "text-mint dark:text-mint" : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"} ${className}`}
      title={copied ? "Copied!" : address}
    >
      <span>{short ? shortenAddress(address) : address}</span>
      {copied ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="font-sans not-italic">Copied!</span>
        </>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  );
}
