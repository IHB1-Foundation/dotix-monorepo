"use client";

import { formatUnits } from "viem";

import type { TokenMeta } from "@/hooks/useTokenMeta";
import type { VaultAssetState } from "@/hooks/useVaultState";

import { Card } from "./Card";
import { CopyableAddress } from "./CopyableAddress";
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

  return (
    <Card variant="interactive">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TokenAvatar symbol={symbol} address={asset.token} size={36} color={color} />
          <div>
            <p className="text-base font-semibold font-display">{symbol}</p>
            <CopyableAddress address={asset.token} />
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            asset.enabled ? "bg-mint/20 text-mint" : "bg-error-light text-error-dark"
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
    </Card>
  );
}
