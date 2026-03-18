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

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <p className="text-slate-500">Balance <span className="font-semibold text-ink dark:text-slate-100">{Number(formatUnits(asset.balance, decimals)).toFixed(4)}</span></p>
        <p className="text-slate-500">Value <span className="font-semibold text-ink dark:text-slate-100">{Number(formatUnits(asset.valueInBase, 18)).toFixed(4)} <span className="text-xs font-normal text-muted">PAS</span></span></p>
        <p className="text-slate-500">Target <span className="font-semibold text-ink dark:text-slate-100">{(asset.targetBps / 100).toFixed(2)}%</span></p>
      </div>

      <div className="mt-3">
        <WeightBar currentBps={asset.currentBps} targetBps={asset.targetBps} />
      </div>
    </Card>
  );
}
