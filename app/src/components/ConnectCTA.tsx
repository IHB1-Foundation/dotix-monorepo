"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { BottomSheet } from "@/components/BottomSheet";

type ConnectCTAProps = {
  title?: string;
  description?: string;
  /** "full" = full-page blocker (default), "inline" = compact banner */
  variant?: "full" | "inline";
};

const defaultTitle = "Connect your wallet to explore the Polkadot-native index vault";
const defaultDescription =
  "Dotix helps you deposit once and keep a rules-based Polkadot portfolio balanced automatically.";

function ConnectButtonInner() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openChainModal }) => {
        if (!mounted) {
          return <div className="inline-flex h-9 w-36 animate-pulse rounded-lg bg-slate-200" />;
        }
        if (!account || !chain) {
          return (
            <>
              {/* Desktop: direct modal */}
              <button
                type="button"
                onClick={openConnectModal}
                className="hidden items-center justify-center rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 focus-visible:ring-offset-2 sm:inline-flex"
              >
                Connect Wallet
              </button>
              {/* Mobile: bottom sheet trigger */}
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center justify-center rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 focus-visible:ring-offset-2 sm:hidden"
              >
                Connect Wallet
              </button>
              <BottomSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title="Connect Wallet"
              >
                <div className="space-y-4 py-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Connect your wallet to access Dotix on Polkadot Hub.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      openConnectModal();
                    }}
                    className="w-full rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    Choose Wallet
                  </button>
                </div>
              </BottomSheet>
            </>
          );
        }
        return (
          <button
            type="button"
            onClick={openChainModal}
            className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Connected to {chain.name}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export function ConnectCTA({ title = defaultTitle, description = defaultDescription, variant = "full" }: ConnectCTAProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-ocean/20 bg-ocean/5 px-4 py-3 dark:border-ocean/30 dark:bg-ocean/10">
        <p className="text-sm text-slate-600 dark:text-slate-300">Connect wallet to see your position</p>
        <ConnectButtonInner />
      </div>
    );
  }

  return (
    <section className="card p-6 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Wallet Required</p>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="text-sm text-slate-600 sm:text-base">{description}</p>

        <div className="pt-2">
          <ConnectButton.Custom>
            {({ account, chain, mounted, openConnectModal, openChainModal }) => {
              if (!mounted) {
                return (
                  <div className="inline-flex h-12 w-56 animate-pulse rounded-xl bg-slate-200" />
                );
              }

              if (!account || !chain) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-gradient px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 focus-visible:ring-offset-2"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={openChainModal}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Connected to {chain.name}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>

        <ol className="grid grid-cols-1 gap-2 text-left text-sm sm:grid-cols-3">
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="font-semibold text-ink dark:text-slate-100">1. Connect</p>
            <p className="text-slate-600 dark:text-slate-400">Link your wallet on Polkadot Hub.</p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="font-semibold text-ink dark:text-slate-100">2. Deposit</p>
            <p className="text-slate-600 dark:text-slate-400">Deposit USDC, receive DOTIX shares.</p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="font-semibold text-ink dark:text-slate-100">3. Earn</p>
            <p className="text-slate-600 dark:text-slate-400">Track rebalances and XCM activity.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
