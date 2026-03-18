"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { AssetRow } from "@/components/AssetRow";
import { ConnectCTA } from "@/components/ConnectCTA";
import { RebalanceStatus } from "@/components/RebalanceStatus";
import { useTokenMeta } from "@/hooks/useTokenMeta";
import { useVaultState } from "@/hooks/useVaultState";

function formatBase(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(4);
}

function DashboardSkeleton() {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article key={`kpi-skeleton-${idx}`} className="card animate-pulse p-4">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-28 rounded bg-slate-200" />
          </article>
        ))}
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-3 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-44 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-52 rounded bg-slate-200" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`asset-skeleton-${idx}`} className="card animate-pulse p-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-40 rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-3 rounded bg-slate-200" />
              <div className="h-3 rounded bg-slate-200" />
              <div className="h-3 rounded bg-slate-200" />
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const vault = useVaultState();
  const tokens = vault.assets.map((asset) => asset.token);
  const { byToken } = useTokenMeta(tokens);

  if (!isConnected) {
    return <ConnectCTA />;
  }

  if (vault.isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">NAV</h2>
          <p className="mt-2 text-2xl font-bold">{formatBase(vault.nav)}</p>
        </article>
        <article className="card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Price</h2>
          <p className="mt-2 text-2xl font-bold">{formatBase(vault.pdotPrice)}</p>
        </article>
        <article className="card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Total Supply</h2>
          <p className="mt-2 text-2xl font-bold">{formatBase(vault.totalSupply)}</p>
        </article>
      </div>

      <RebalanceStatus
        cooldownSeconds={vault.cooldownSeconds}
        lastRebalanceAt={vault.lastRebalanceAt}
        paused={vault.paused}
      />

      <div className="space-y-3">
        {vault.assets.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No assets configured in vault.</div>
        ) : (
          vault.assets.map((asset) => <AssetRow key={asset.token} asset={asset} meta={byToken[asset.token]} />)
        )}
      </div>
    </section>
  );
}
