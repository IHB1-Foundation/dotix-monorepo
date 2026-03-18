"use client";

import { formatUnits } from "viem";

import type { TokenMeta } from "@/hooks/useTokenMeta";
import type { VaultAssetState } from "@/hooks/useVaultState";

import { CopyableAddress } from "./CopyableAddress";
import { WeightBar } from "./WeightBar";

type Props = {
  asset: VaultAssetState;
  meta?: TokenMeta;
};

export function AssetRow({ asset, meta }: Props) {
  const decimals = meta?.decimals ?? 18;
  const symbol = meta?.symbol || "UNKNOWN";

  return (
    <div className="card p-4 transition-colors hover:border-ocean/40">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold">{symbol}</p>
          <CopyableAddress address={asset.token} />
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            asset.enabled ? "bg-mint/20 text-mint" : "bg-red-100 text-red-700"
          }`}
        >
          {asset.enabled ? "enabled" : "disabled"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
        <p>Balance: {Number(formatUnits(asset.balance, decimals)).toFixed(4)}</p>
        <p>Value (base): {Number(formatUnits(asset.valueInBase, 18)).toFixed(4)}</p>
        <p>Target: {(asset.targetBps / 100).toFixed(2)}%</p>
      </div>

      <div className="mt-3">
        <WeightBar currentBps={asset.currentBps} targetBps={asset.targetBps} />
      </div>
    </div>
  );
}
