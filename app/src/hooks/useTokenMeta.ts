"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";

import { REGISTRY_ABI, REGISTRY_ADDRESS } from "@/lib/contracts";
import { POLL_MEDIUM } from "@/lib/constants";

export type TokenMeta = {
  name: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
};

export function useTokenMeta(tokens: string[]) {
  const validTokens = useMemo(
    () => tokens.filter((token) => token !== "0x0000000000000000000000000000000000000000"),
    [tokens]
  );

  const { data, isLoading, error } = useReadContracts({
    contracts: validTokens.map((token) => ({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "getTokenMeta" as const,
      args: [token as `0x${string}`] as const,
    })),
    query: {
      enabled: validTokens.length > 0,
      refetchInterval: POLL_MEDIUM,
    },
  });

  const byToken = useMemo<Record<string, TokenMeta>>(() => {
    const out: Record<string, TokenMeta> = {};

    validTokens.forEach((token, index) => {
      const row = data?.[index];
      if (row?.status !== "success" || !row.result) {
        return;
      }

      const { name, symbol, decimals, enabled } = row.result as {
        name: string;
        symbol: string;
        decimals: number;
        enabled: boolean;
      };
      out[token] = { name, symbol, decimals, enabled };
    });

    return out;
  }, [data, validTokens]);

  return {
    byToken,
    isLoading,
    error,
  };
}
