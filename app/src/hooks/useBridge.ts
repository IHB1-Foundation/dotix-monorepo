"use client";

import { useState } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { useXcmDemo, type WeighResult } from "@/hooks/useXcmDemo";
import { POLL_FAST } from "@/lib/constants";
import type { ParachainDestination } from "@/lib/xcm-templates";

export type BridgeStep = "idle" | "weighed" | "done";

export function useBridge(destination: ParachainDestination | null) {
  const { address } = useAccount();
  const messageHex = destination?.messageHex ?? ("0x03020100" as `0x${string}`);
  const xcm = useXcmDemo(messageHex);
  const [step, setStep] = useState<BridgeStep>("idle");

  // Read baseAsset address from vault
  const baseAssetRead = useReadContract({
    address: VAULT_ADDRESS,
    abi: INDEX_VAULT_ABI,
    functionName: "baseAsset",
  });

  const baseAsset = (baseAssetRead.data as `0x${string}` | undefined) ?? undefined;

  // Read USDC balance + metadata
  const baseMetaContracts =
    baseAsset && address
      ? [
          { address: baseAsset, abi: erc20Abi, functionName: "decimals" as const },
          { address: baseAsset, abi: erc20Abi, functionName: "symbol" as const },
          { address: baseAsset, abi: erc20Abi, functionName: "balanceOf", args: [address] as const },
        ]
      : [];

  const baseMetaRead = useReadContracts({
    contracts: baseMetaContracts,
    query: { enabled: Boolean(baseAsset && address), refetchInterval: POLL_FAST },
  });

  const decimals = (baseMetaRead.data?.[0]?.status === "success" ? Number(baseMetaRead.data[0].result) : 18) ?? 18;
  const rawSymbol = (baseMetaRead.data?.[1]?.status === "success" ? String(baseMetaRead.data[1].result) : "USDC") ?? "USDC";
  const symbol = rawSymbol === "BASE" ? "USDC" : rawSymbol;
  const usdcBalance = (baseMetaRead.data?.[2]?.status === "success" ? (baseMetaRead.data[2].result as bigint) : 0n) ?? 0n;

  async function weigh(): Promise<void> {
    await xcm.weighDefault();
    setStep("weighed");
  }

  async function execute(): Promise<void> {
    await xcm.executeMessage();
    setStep("done");
  }

  function reset(): void {
    setStep("idle");
  }

  return {
    usdcBalance,
    decimals,
    symbol,
    destination,
    isKeeper: xcm.isKeeper,
    weighResult: xcm.result as WeighResult,
    step,
    weigh,
    execute,
    reset,
    txHash: xcm.txHash,
    txPending: xcm.txPending,
    txConfirmed: xcm.txConfirmed,
    error: xcm.error,
  };
}
