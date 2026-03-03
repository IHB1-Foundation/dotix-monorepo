"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";

import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";

export function useVaultRoles() {
  const { address } = useAccount();

  const roleReads = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS as `0x${string}`,
        abi: INDEX_VAULT_ABI,
        functionName: "STRATEGIST_ROLE",
      },
      {
        address: VAULT_ADDRESS as `0x${string}`,
        abi: INDEX_VAULT_ABI,
        functionName: "KEEPER_ROLE",
      },
    ] as any,
  });

  const strategistRole = roleReads.data?.[0]?.status === "success" ? (roleReads.data[0].result as string) : undefined;
  const keeperRole = roleReads.data?.[1]?.status === "success" ? (roleReads.data[1].result as string) : undefined;

  const hasRoleReads = useReadContracts({
    contracts:
      address && strategistRole && keeperRole
        ? [
            {
              address: VAULT_ADDRESS as `0x${string}`,
              abi: INDEX_VAULT_ABI,
              functionName: "hasRole",
              args: [strategistRole, address],
            },
            {
              address: VAULT_ADDRESS as `0x${string}`,
              abi: INDEX_VAULT_ABI,
              functionName: "hasRole",
              args: [keeperRole, address],
            },
          ]
        : ([] as any),
    query: {
      enabled: Boolean(address && strategistRole && keeperRole),
      refetchInterval: 8_000,
    },
  });

  const isStrategist = useMemo(
    () => Boolean(hasRoleReads.data?.[0]?.status === "success" && hasRoleReads.data[0].result),
    [hasRoleReads.data]
  );
  const isKeeper = useMemo(
    () => Boolean(hasRoleReads.data?.[1]?.status === "success" && hasRoleReads.data[1].result),
    [hasRoleReads.data]
  );

  return {
    isStrategist,
    isKeeper,
  };
}
