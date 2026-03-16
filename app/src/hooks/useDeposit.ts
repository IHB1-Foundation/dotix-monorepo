"use client";

import { useMemo, useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { mapContractError } from "@/lib/errors";

export function useDeposit(amount: string, slippagePct: number) {
  const { address } = useAccount();
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | undefined>();

  const vaultReadContracts = [
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "baseAsset",
    },
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "calcNAV",
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
    {
      address: VAULT_ADDRESS,
      abi: INDEX_VAULT_ABI,
      functionName: "lastRebalanceAt",
    },
  ] as const;

  const vaultReads = useReadContracts({
    contracts: vaultReadContracts,
  });

  const baseAsset = (vaultReads.data?.[0]?.status === "success" ? (vaultReads.data[0].result as string) : undefined) as
    | `0x${string}`
    | undefined;
  const nav = (vaultReads.data?.[1]?.status === "success" ? (vaultReads.data[1].result as bigint) : 0n) ?? 0n;
  const paused = (vaultReads.data?.[2]?.status === "success" ? Boolean(vaultReads.data[2].result) : false) ?? false;

  const pdotSupplyRead = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: INDEX_VAULT_ABI,
    functionName: "pdot",
  });

  const pdotAddress = (pdotSupplyRead.data as string | undefined) as `0x${string}` | undefined;

  const supplyRead = useReadContract({
    address: pdotAddress,
    abi: [
      {
        type: "function",
        name: "totalSupply",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
    ] as const,
    functionName: "totalSupply",
    query: {
      enabled: Boolean(pdotAddress),
    },
  });

  const baseMetaContracts =
    baseAsset && address
      ? [
          {
            address: baseAsset,
            abi: erc20Abi,
            functionName: "decimals" as const,
          },
          {
            address: baseAsset,
            abi: erc20Abi,
            functionName: "symbol" as const,
          },
          {
            address: baseAsset,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [address] as const,
          },
          {
            address: baseAsset,
            abi: erc20Abi,
            functionName: "allowance" as const,
            args: [address, VAULT_ADDRESS] as const,
          },
        ]
      : [];

  const baseMetaRead = useReadContracts({
    contracts: baseMetaContracts,
    query: {
      enabled: Boolean(baseAsset && address),
      refetchInterval: 6_000,
    },
  });

  const decimals =
    (baseMetaRead.data?.[0]?.status === "success" ? Number(baseMetaRead.data[0].result) : 18) ?? 18;
  const symbol = (baseMetaRead.data?.[1]?.status === "success" ? String(baseMetaRead.data[1].result) : "BASE") ?? "BASE";
  const balance =
    (baseMetaRead.data?.[2]?.status === "success" ? (baseMetaRead.data[2].result as bigint) : 0n) ?? 0n;
  const allowance =
    (baseMetaRead.data?.[3]?.status === "success" ? (baseMetaRead.data[3].result as bigint) : 0n) ?? 0n;

  const amountIn = useMemo(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return 0n;
    }

    try {
      return parseUnits(amount, decimals);
    } catch {
      return 0n;
    }
  }, [amount, decimals]);

  const totalSupply = (typeof supplyRead.data === "bigint" ? supplyRead.data : 0n) ?? 0n;

  const expectedShares = useMemo(() => {
    if (amountIn === 0n) return 0n;
    if (totalSupply === 0n) return amountIn;
    if (nav === 0n) return 0n;
    return (amountIn * totalSupply) / nav;
  }, [amountIn, totalSupply, nav]);

  const minSharesOut = useMemo(() => {
    const bps = BigInt(Math.max(0, Math.floor((1 - slippagePct / 100) * 10_000)));
    return (expectedShares * bps) / 10_000n;
  }, [expectedShares, slippagePct]);

  const requiresApproval = allowance < amountIn;

  const approveWrite = useWriteContract();
  const depositWrite = useWriteContract();

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash });
  const depositReceipt = useWaitForTransactionReceipt({ hash: depositHash });

  async function approve(): Promise<void> {
    if (!baseAsset || amountIn === 0n) return;

    setError(undefined);
    try {
      const hash = await approveWrite.writeContractAsync({
        address: baseAsset,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS as `0x${string}`, amountIn],
      });
      setApproveHash(hash);
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  async function deposit(): Promise<void> {
    if (amountIn === 0n) return;

    setError(undefined);
    try {
      const hash = await depositWrite.writeContractAsync({
        address: VAULT_ADDRESS,
        abi: INDEX_VAULT_ABI,
        functionName: "deposit",
        args: [amountIn, minSharesOut],
      });
      setDepositHash(hash);
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  return {
    baseAsset,
    baseSymbol: symbol,
    baseDecimals: decimals,
    balance,
    paused,
    amountIn,
    expectedShares,
    minSharesOut,
    requiresApproval,
    approve,
    deposit,
    approveTxHash: approveHash,
    depositTxHash: depositHash,
    approvePending: approveReceipt.isLoading,
    depositPending: depositReceipt.isLoading,
    approveConfirmed: approveReceipt.isSuccess,
    depositConfirmed: depositReceipt.isSuccess,
    error,
  };
}
