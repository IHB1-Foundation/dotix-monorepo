"use client";

import Image from "next/image";

import { useChainId } from "wagmi";

const EXPLORER_BASE = "https://blockscout-testnet.polkadot.io";
const GITHUB_URL = "https://github.com/dotix-finance/dotix-monorepo";

export function Footer() {
  const chainId = useChainId();

  return (
    <footer className="mt-auto border-t border-slate-100 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Image src="/dotix-logo.svg" alt="Dotix" width={16} height={16} className="h-4 w-4 rounded" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">Dotix</span>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-ocean dark:hover:text-ocean-light">
            GitHub
          </a>
          <a href={EXPLORER_BASE} target="_blank" rel="noreferrer" className="transition hover:text-ocean dark:hover:text-ocean-light">
            Explorer
          </a>
          <span>Experimental software · Use at your own risk</span>
          {chainId && (
            <span className="ml-auto font-medium text-slate-500">
              {chainId === 420420417 ? "Polkadot Hub TestNet" : `Chain ${chainId}`}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
