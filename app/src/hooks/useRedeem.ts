"use client";

import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { INDEX_VAULT_ABI, PDOT_ABI, PDOT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";
import { POLL_FAST } from "@/lib/constants";
import { mapContractError } from "@/lib/errors";

export function useRedeem(amount: string, slippagePct: number) {
  const { address } = useAccount();
  const [redeemHash, setRedeemHash] = useState<`0x${string}` | undefined>();
  const [emergencyHash, setEmergencyHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | undefined>();

  const navRead = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: INDEX_VAULT_ABI,
    functionName: "calcNAV",
  });
  const pausedRead = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: INDEX_VAULT_ABI,
    functionName: "paused",
  });
  const supplyRead = useReadContract({
    address: PDOT_ADDRESS as `0x${string}`,
    abi: PDOT_ABI,
    functionName: "totalSupply",
  });
  const balanceRead = useReadContract({
    address: PDOT_ADDRESS as `0x${string}`,
    abi: PDOT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: POLL_FAST,
    },
  });

  const nav = (typeof navRead.data === "bigint" ? navRead.data : 0n) ?? 0n;
  const totalSupply = (typeof supplyRead.data === "bigint" ? supplyRead.data : 0n) ?? 0n;
  const pdotBalance = (typeof balanceRead.data === "bigint" ? balanceRead.data : 0n) ?? 0n;
  const paused = Boolean(pausedRead.data);

  const sharesIn = useMemo(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return 0n;
    }

    try {
      return parseUnits(amount, 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const expectedBaseOut = useMemo(() => {
    if (sharesIn === 0n || totalSupply === 0n) return 0n;
    return (sharesIn * nav) / totalSupply;
  }, [sharesIn, nav, totalSupply]);

  const minBaseOut = useMemo(() => {
    const bps = BigInt(Math.max(0, Math.floor((1 - slippagePct / 100) * 10_000)));
    return (expectedBaseOut * bps) / 10_000n;
  }, [expectedBaseOut, slippagePct]);

  const redeemWrite = useWriteContract();
  const emergencyWrite = useWriteContract();

  const redeemReceipt = useWaitForTransactionReceipt({ hash: redeemHash });
  const emergencyReceipt = useWaitForTransactionReceipt({ hash: emergencyHash });

  async function redeem(): Promise<void> {
    if (sharesIn === 0n) return;
    setError(undefined);

    try {
      const hash = await redeemWrite.writeContractAsync({
        address: VAULT_ADDRESS,
        abi: INDEX_VAULT_ABI,
        functionName: "redeem",
        args: [sharesIn, minBaseOut],
      });
      setRedeemHash(hash);
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  async function emergencyRedeem(): Promise<void> {
    if (sharesIn === 0n) return;
    setError(undefined);

    try {
      const hash = await emergencyWrite.writeContractAsync({
        address: VAULT_ADDRESS,
        abi: INDEX_VAULT_ABI,
        functionName: "emergencyRedeemToUnderlying",
        args: [sharesIn],
      });
      setEmergencyHash(hash);
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  return {
    paused,
    pdotBalance,
    sharesIn,
    expectedBaseOut,
    minBaseOut,
    redeem,
    emergencyRedeem,
    redeemTxHash: redeemHash,
    emergencyTxHash: emergencyHash,
    redeemPending: redeemReceipt.isLoading,
    emergencyPending: emergencyReceipt.isLoading,
    redeemConfirmed: redeemReceipt.isSuccess,
    emergencyConfirmed: emergencyReceipt.isSuccess,
    error,
  };
}
