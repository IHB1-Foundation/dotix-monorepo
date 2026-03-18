"use client";

import Image from "next/image";

import { CopyableAddress } from "@/components/CopyableAddress";
import { VAULT_ADDRESS, PDOT_ADDRESS, REGISTRY_ADDRESS } from "@/lib/contracts";
import { useChainId } from "wagmi";

const EXPLORER_BASE = "https://blockscout-testnet.polkadot.io";
const GITHUB_URL = "https://github.com/dotix-finance/dotix-monorepo";

export function Footer() {
  const chainId = useChainId();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/60 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Image src="/dotix-logo.svg" alt="Dotix" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="font-display text-base font-bold text-ink dark:text-slate-100">Dotix</span>
            </div>
            <p className="mt-2 text-xs text-muted">Polkadot-native index vault protocol.</p>
            {chainId && (
              <p className="mt-1 text-[11px] text-slate-400">
                Network: <span className="font-medium">{chainId === 420420417 ? "Polkadot Hub TestNet" : `Chain ${chainId}`}</span>
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Resources</p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted transition hover:text-ocean dark:hover:text-ocean-light"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={EXPLORER_BASE}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted transition hover:text-ocean dark:hover:text-ocean-light"
                >
                  Block Explorer
                </a>
              </li>
            </ul>
          </div>

          {/* Contracts */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contracts</p>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Vault</span>
                <div className="mt-0.5">
                  <CopyableAddress address={VAULT_ADDRESS} />
                </div>
              </li>
              <li>
                <span className="text-slate-400">PDOT Token</span>
                <div className="mt-0.5">
                  <CopyableAddress address={PDOT_ADDRESS} />
                </div>
              </li>
              <li>
                <span className="text-slate-400">Registry</span>
                <div className="mt-0.5">
                  <CopyableAddress address={REGISTRY_ADDRESS} />
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            This is experimental software. Use at your own risk. No warranties are provided.
          </p>
        </div>
      </div>
    </footer>
  );
}
