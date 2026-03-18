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
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={`group relative inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 ${className}`}
      title={address}
    >
      <span>{short ? shortenAddress(address) : address}</span>
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
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white">
          Copied!
        </span>
      )}
    </button>
  );
}
