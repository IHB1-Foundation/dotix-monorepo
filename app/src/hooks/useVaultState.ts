"use client";

import { useMemo } from "react";
import { erc20Abi } from "viem";
import { useReadContracts } from "wagmi";

import { INDEX_VAULT_ABI, PDOT_ABI, PDOT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";
import { POLL_FAST } from "@/lib/constants";

export type VaultAssetState = {
  token: string;
  targetBps: number;
  maxSlippageBps: number;
  maxTradeBps: number;
  enabled: boolean;
  balance: bigint;
  spotPriceInBase: bigint;
  valueInBase: bigint;
  currentBps: number;
};

export type VaultState = {
  nav: bigint;
  totalSupply: bigint;
  pdotPrice: bigint;
  cooldownSeconds: number;
  lastRebalanceAt: number;
  paused: boolean;
  assets: VaultAssetState[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: number;
  refetch: () => Promise<void>;
};

export function useVaultState(): VaultState {
  const baseReadContracts = [
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "calcNAV",
    },
    {
      address: PDOT_ADDRESS,
      abi: PDOT_ABI,
      functionName: "totalSupply",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "lastRebalanceAt",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "cooldownSeconds",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "paused",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "assetsLength",
    },
  ] as const;

  const baseReads = useReadContracts({
    contracts: baseReadContracts,
    query: {
      refetchInterval: POLL_FAST,
    },
  });

  const nav = (baseReads.data?.[0]?.status === "success" ? (baseReads.data[0].result as bigint) : 0n) ?? 0n;
  const totalSupply =
    (baseReads.data?.[1]?.status === "success" ? (baseReads.data[1].result as bigint) : 0n) ?? 0n;
  const lastRebalanceAt =
    (baseReads.data?.[2]?.status === "success" ? Number(baseReads.data[2].result) : 0) ?? 0;
  const cooldownSeconds =
    (baseReads.data?.[3]?.status === "success" ? Number(baseReads.data[3].result) : 0) ?? 0;
  const paused = (baseReads.data?.[4]?.status === "success" ? Boolean(baseReads.data[4].result) : false) ?? false;
  const assetsLength =
    (baseReads.data?.[5]?.status === "success" ? Number(baseReads.data[5].result) : 0) ?? 0;

  const assetsConfigContracts = Array.from({ length: assetsLength }, (_, index) => ({
    address: VAULT_ADDRESS,
    abi: INDEX_VAULT_ABI,
    functionName: "assets" as const,
    args: [BigInt(index)] as const,
  }));

  const assetsConfigReads = useReadContracts({
    contracts: assetsConfigContracts,
    query: {
      enabled: assetsLength > 0,
      refetchInterval: POLL_FAST,
    },
  });

  const assetsConfig = useMemo(
    () =>
      (assetsConfigReads.data ?? [])
        .map((row) => {
          if (row.status !== "success") return null;
          const [token, targetBps, maxSlippageBps, maxTradeBps, enabled] = row.result as [
            string,
            number,
            number,
            number,
            boolean
          ];

          return {
            token,
            targetBps: Number(targetBps),
            maxSlippageBps: Number(maxSlippageBps),
            maxTradeBps: Number(maxTradeBps),
            enabled,
          };
        })
        .filter(Boolean) as Array<{
        token: string;
        targetBps: number;
        maxSlippageBps: number;
        maxTradeBps: number;
        enabled: boolean;
      }>,
    [assetsConfigReads.data]
  );

  const balancePriceContracts = assetsConfig.flatMap((asset) => [
    {
      address: asset.token as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [VAULT_ADDRESS] as const,
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "getSpotPrice" as const,
      args: [asset.token as `0x${string}`] as const,
    },
  ]);

  const balancePriceReads = useReadContracts({
    contracts: balancePriceContracts,
    query: {
      enabled: assetsConfig.length > 0,
      refetchInterval: POLL_FAST,
    },
  });

  const assets = useMemo<VaultAssetState[]>(() => {
    if (!balancePriceReads.data) {
      return [];
    }

    return assetsConfig.map((asset, index) => {
      const balanceRow = balancePriceReads.data[index * 2];
      const priceRow = balancePriceReads.data[index * 2 + 1];

      const balance =
        balanceRow?.status === "success" && typeof balanceRow.result === "bigint" ? balanceRow.result : 0n;
      const spotPriceInBase =
        priceRow?.status === "success" && typeof priceRow.result === "bigint" ? priceRow.result : 0n;

      const valueInBase = (balance * spotPriceInBase) / 10n ** 18n;
      const currentBps = nav > 0n ? Number((valueInBase * 10_000n) / nav) : 0;

      return {
        ...asset,
        balance,
        spotPriceInBase,
        valueInBase,
        currentBps,
      };
    });
  }, [assetsConfig, balancePriceReads.data, nav]);

  const pdotPrice = totalSupply > 0n ? (nav * 10n ** 18n) / totalSupply : 0n;
  const lastUpdatedAt = Math.max(
    baseReads.dataUpdatedAt ?? 0,
    assetsConfigReads.dataUpdatedAt ?? 0,
    balancePriceReads.dataUpdatedAt ?? 0
  );

  async function refetch(): Promise<void> {
    await Promise.all([baseReads.refetch(), assetsConfigReads.refetch(), balancePriceReads.refetch()]);
  }

  return {
    nav,
    totalSupply,
    pdotPrice,
    cooldownSeconds,
    lastRebalanceAt,
    paused,
    assets,
    isLoading: baseReads.isLoading || assetsConfigReads.isLoading || balancePriceReads.isLoading,
    isRefreshing: baseReads.isFetching || assetsConfigReads.isFetching || balancePriceReads.isFetching,
    lastUpdatedAt,
    refetch,
  };
}
