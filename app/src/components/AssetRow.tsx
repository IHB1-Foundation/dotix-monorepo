"use client";

import { useState } from "react";
import { formatUnits } from "viem";

import type { TokenMeta } from "@/hooks/useTokenMeta";
import type { VaultAssetState } from "@/hooks/useVaultState";

import { Card } from "./Card";
import { TokenAvatar } from "./TokenAvatar";
import { WeightBar } from "./WeightBar";

type Props = {
  asset: VaultAssetState;
  meta?: TokenMeta;
  color?: string;
};

export function AssetRow({ asset, meta, color }: Props) {
  const decimals = meta?.decimals ?? 18;
  const symbol = meta?.symbol || "UNKNOWN";
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="interactive">
      {/* Primary row: avatar + symbol + weight + bar */}
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <TokenAvatar symbol={symbol} address={asset.token} size={36} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold font-display leading-tight">{symbol}</p>
            {!asset.enabled && (
              <span className="rounded-full bg-error-light px-2 py-0.5 text-xs font-semibold text-error-dark">
                disabled
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {(asset.currentBps / 100).toFixed(2)}% current · {(asset.targetBps / 100).toFixed(2)}% target
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="mt-3">
        <WeightBar currentBps={asset.currentBps} targetBps={asset.targetBps} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className="mt-0.5 font-semibold tabular-nums text-ink dark:text-slate-100">
              {Number(formatUnits(asset.balance, decimals)).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Value</p>
            <p className="mt-0.5 font-semibold tabular-nums text-ink dark:text-slate-100">
              {Number(formatUnits(asset.valueInBase, 18)).toFixed(4)}{" "}
              <span className="text-xs font-normal text-muted">PAS</span>
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
