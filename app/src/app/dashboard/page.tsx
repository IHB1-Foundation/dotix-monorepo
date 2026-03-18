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
import { Tooltip } from "@/components/Tooltip";
import { useCountUp } from "@/hooks/useCountUp";
import { formatToken, decimalFormatter } from "@/lib/format";

function DashboardSkeleton() {
  return (
    <section className="space-y-4">
      <PageHeader title="Dashboard" description="Vault overview and asset allocation." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article key={`kpi-skeleton-${idx}`} className="card animate-pulse p-4">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-8 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          </article>
        ))}
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-44 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-3 w-52 rounded bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`asset-skeleton-${idx}`} className="card animate-pulse p-4">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
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

  const navNum = Number(formatUnits(vault.nav, 18));
  const priceNum = Number(formatUnits(vault.pdotPrice, 18));
  const supplyNum = Number(formatUnits(vault.totalSupply, 18));

  const navAnimated = useCountUp(navNum);
  const priceAnimated = useCountUp(priceNum);
  const supplyAnimated = useCountUp(supplyNum);

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
      {address ? (
        <article className="relative overflow-hidden rounded-xl border border-ocean/30 bg-gradient-to-br from-ocean/10 via-white/80 to-mint/10 p-5 shadow-sm backdrop-blur dark:border-ocean/40 dark:from-ocean/20 dark:via-slate-900/80 dark:to-mint/10">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ocean to-mint" />
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">My Position</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">My PDOT Balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-slate-100">
                {formatToken(pdotBalance)} <span className="text-sm font-semibold text-slate-500">PDOT</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">My Value</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-slate-100">
                {vault.totalSupply > 0n
                  ? formatToken((pdotBalance * vault.nav) / vault.totalSupply)
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
      ) : (
        <ConnectCTA variant="inline" />
      )}

      <AllocationChart items={chartItems} totalLabel={formatToken(vault.nav)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className={`card-hero p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
          <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean/15 text-ocean">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Tooltip content="Net Asset Value — the total value of all assets held in the vault, denominated in PAS">NAV</Tooltip>
            </h2>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{decimalFormatter.format(navAnimated)}</p>
          <p className="mt-1 text-xs text-slate-500">Total vault assets under management (PAS)</p>
        </article>
        <article className={`card-hero p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
          <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/15 text-mint">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDOT Price</h2>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{decimalFormatter.format(priceAnimated)}</p>
          <p className="mt-1 text-xs text-slate-500">Current price per PDOT share (PAS)</p>
        </article>
        <article className={`card-hero p-4 transition-transform duration-200 hover:scale-[1.01] ${vault.isRefreshing ? "animate-pulse" : ""}`}>
          <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Tooltip content="Total PDOT shares minted across all depositors. More shares = more users in the vault.">PDOT Supply</Tooltip>
            </h2>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{decimalFormatter.format(supplyAnimated)}</p>
          <p className="mt-1 text-xs text-slate-500">Total PDOT shares in circulation</p>
        </article>
      </div>

      <RebalanceStatus
        cooldownSeconds={vault.cooldownSeconds}
        lastRebalanceAt={vault.lastRebalanceAt}
        paused={vault.paused}
      />

      <div className="space-y-3">
        {vault.assets.length === 0 ? (
          <div className="card p-8 text-center">
            <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="8" y="20" width="48" height="36" rx="4" />
              <path d="M20 20v-4a12 12 0 0 1 24 0v4" />
              <path d="M32 36v4" strokeLinecap="round" />
              <circle cx="32" cy="34" r="2" fill="currentColor" />
            </svg>
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">No assets in the vault yet</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Assets will appear here once the vault is configured by an admin.</p>
          </div>
        ) : (
          vault.assets.map((asset, idx) => (
            <AssetRow key={asset.token} asset={asset} meta={byToken[asset.token]} color={allocationColorByIndex(idx)} />
          ))
        )}
      </div>
    </section>
  );
}
