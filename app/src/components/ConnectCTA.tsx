"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

type ConnectCTAProps = {
  title?: string;
  description?: string;
};

const defaultTitle = "Connect your wallet to explore the Polkadot-native index vault";
const defaultDescription =
  "Dotix helps you deposit once and keep a rules-based Polkadot portfolio balanced automatically.";

export function ConnectCTA({ title = defaultTitle, description = defaultDescription }: ConnectCTAProps) {
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
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-ocean px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0b65b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 focus-visible:ring-offset-2"
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
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-ink">1. Connect</p>
            <p className="text-slate-600">Link your wallet on Polkadot Hub.</p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-ink">2. Deposit</p>
            <p className="text-slate-600">Mint PDOT shares from base tokens.</p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-ink">3. Earn</p>
            <p className="text-slate-600">Track rebalances and XCM activity.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
