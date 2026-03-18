"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { AllocationChart, allocationColorByIndex } from "@/components/AllocationChart";
import { AssetRow } from "@/components/AssetRow";
import { ConnectCTA } from "@/components/ConnectCTA";
import { PageHeader } from "@/components/PageHeader";
import { RebalanceStatus } from "@/components/RebalanceStatus";
import { useTokenMeta } from "@/hooks/useTokenMeta";
import { useVaultState } from "@/hooks/useVaultState";
import { PDOT_ABI, PDOT_ADDRESS } from "@/lib/contracts";
import { POLL_FAST } from "@/lib/constants";

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
  const { isConnected, address } = useAccount();
  const vault = useVaultState();

  const pdotBalanceRead = useReadContract({
    address: PDOT_ADDRESS as `0x${string}`,
    abi: PDOT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: POLL_FAST,
    },
  });
  const pdotBalance = typeof pdotBalanceRead.data === "bigint" ? pdotBalanceRead.data : 0n;
  const [now, setNow] = useState(() => Date.now());
  const tokens = vault.assets.map((asset) => asset.token);
  const { byToken } = useTokenMeta(tokens);
  const chartItems = vault.assets.map((asset, index) => ({
    label: byToken[asset.token]?.symbol ?? `${asset.token.slice(0, 6)}...${asset.token.slice(-4)}`,
    value: Number(formatUnits(asset.valueInBase, 18)),
    color: allocationColorByIndex(index),
  }));
  const freshnessSeconds = useMemo(() => {
    if (vault.lastUpdatedAt <= 0) return null;
    return Math.max(Math.floor((now - vault.lastUpdatedAt) / 1000), 0);
  }, [now, vault.lastUpdatedAt]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!isConnected) {
    return <ConnectCTA />;
  }

  if (vault.isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={`Vault overview and asset allocation.${freshnessSeconds !== null ? ` Last updated ${freshnessSeconds}s ago.` : ""}`}
        action={
          <button
            type="button"
            onClick={() => void vault.refetch()}
            disabled={vault.isRefreshing}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {vault.isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />
      {address && (
        <article className="relative overflow-hidden rounded-xl border border-ocean/30 bg-gradient-to-br from-ocean/10 via-white/80 to-mint/10 p-5 shadow-sm backdrop-blur dark:border-ocean/40 dark:from-ocean/20 dark:via-slate-900/80 dark:to-mint/10">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ocean to-mint" />
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">My Position</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">My PDOT Balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-slate-100">
                {formatMetric(pdotBalance)} <span className="text-sm font-semibold text-slate-500">PDOT</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">My Value</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-slate-100">
                {vault.totalSupply > 0n
                  ? formatMetric((pdotBalance * vault.nav) / vault.totalSupply)
                  : "—"}{" "}
                <span className="text-sm font-semibold text-slate-500">PAS</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share of Vault</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-slate-100">
                {vault.totalSupply > 0n
                  ? `${((Number(pdotBalance) / Number(vault.totalSupply)) * 100).toFixed(2)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </article>
      )}

      <AllocationChart items={chartItems} totalLabel={formatMetric(vault.nav)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className={`card p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">NAV</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatMetric(vault.nav)}</p>
          <p className="mt-1 text-xs text-slate-500">PAS</p>
        </article>
        <article className={`card p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Price</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatMetric(vault.pdotPrice)}</p>
          <p className="mt-1 text-xs text-slate-500">per PDOT</p>
        </article>
        <article className={`card p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
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
