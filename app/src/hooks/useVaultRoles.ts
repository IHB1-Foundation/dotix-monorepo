"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";

import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { POLL_MEDIUM } from "@/lib/constants";

export function useVaultRoles() {
  const { address } = useAccount();

  const roleContracts = [
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "STRATEGIST_ROLE",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "KEEPER_ROLE",
    },
  ] as const;

  const roleReads = useReadContracts({
    contracts: roleContracts,
  });

  const strategistRole = roleReads.data?.[0]?.status === "success" ? (roleReads.data[0].result as string) : undefined;
  const keeperRole = roleReads.data?.[1]?.status === "success" ? (roleReads.data[1].result as string) : undefined;

  const hasRoleReads = useReadContracts({
    contracts:
      address && strategistRole && keeperRole
        ? [
            {
              address: VAULT_ADDRESS,
              abi: INDEX_VAULT_ABI,
              functionName: "hasRole" as const,
              args: [strategistRole as `0x${string}`, address] as const,
            },
            {
              address: VAULT_ADDRESS,
              abi: INDEX_VAULT_ABI,
              functionName: "hasRole" as const,
              args: [keeperRole as `0x${string}`, address] as const,
            },
          ]
        : [],
    query: {
      enabled: Boolean(address && strategistRole && keeperRole),
      refetchInterval: POLL_MEDIUM,
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
