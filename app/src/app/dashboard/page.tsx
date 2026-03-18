"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { AssetRow } from "@/components/AssetRow";
import { ConnectCTA } from "@/components/ConnectCTA";
import { PageHeader } from "@/components/PageHeader";
import { RebalanceStatus } from "@/components/RebalanceStatus";
import { useTokenMeta } from "@/hooks/useTokenMeta";
import { useVaultState } from "@/hooks/useVaultState";

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatMetric(value: bigint, decimals = 18): string {
  const parsed = Number(formatUnits(value, decimals));
  if (!Number.isFinite(parsed) || parsed === 0) {
    return "—";
  }

  return decimalFormatter.format(parsed);
}

function DashboardSkeleton() {
  return (
    <section className="space-y-4">
      <PageHeader title="Dashboard" description="Vault overview and asset allocation." />

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
        <article className="card p-4 transition-transform duration-200 hover:scale-[1.01]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">NAV</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatMetric(vault.nav)}</p>
          <p className="mt-1 text-xs text-slate-500">PAS</p>
        </article>
        <article className="card p-4 transition-transform duration-200 hover:scale-[1.01]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Price</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatMetric(vault.pdotPrice)}</p>
          <p className="mt-1 text-xs text-slate-500">per PDOT</p>
        </article>
        <article className="card p-4 transition-transform duration-200 hover:scale-[1.01]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Total Supply</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatMetric(vault.totalSupply)}</p>
          <p className="mt-1 text-xs text-slate-500">PDOT shares</p>
        </article>
      </div>

      <RebalanceStatus
        cooldownSeconds={vault.cooldownSeconds}
        lastRebalanceAt={vault.lastRebalanceAt}
        paused={vault.paused}
      />

      <div className="card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Deviation Legend</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
            deviation &lt;= 5%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            deviation 5-10%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            deviation &gt; 10%
          </span>
        </div>
      </div>

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
