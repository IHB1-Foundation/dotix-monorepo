"use client";

import { formatUnits } from "viem";

import { AssetRow } from "@/components/AssetRow";
import { RebalanceStatus } from "@/components/RebalanceStatus";
import { useTokenMeta } from "@/hooks/useTokenMeta";
import { useVaultState } from "@/hooks/useVaultState";

function formatBase(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(4);
}

export default function DashboardPage() {
  const vault = useVaultState();
  const tokens = vault.assets.map((asset) => asset.token);
  const { byToken } = useTokenMeta(tokens);

  if (vault.isLoading) {
    return <section className="card p-6">Loading dashboard state...</section>;
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
