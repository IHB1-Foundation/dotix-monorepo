"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { XCM_DEMO_ABI, XCM_DEMO_ADDRESS } from "@/lib/contracts";
import { mapContractError } from "@/lib/errors";

export type WeighResult = {
  refTime: bigint;
  proofSize: bigint;
} | null;

export function useXcmDemo(messageHex: `0x${string}`) {
  const { address } = useAccount();
  const [result, setResult] = useState<WeighResult>(null);
  const [error, setError] = useState<string | undefined>();

  const keeperRoleRead = useReadContract({
    address: XCM_DEMO_ADDRESS as `0x${string}`,
    abi: XCM_DEMO_ABI,
    functionName: "KEEPER_ROLE",
  });

  const hasKeeperRead = useReadContract({
    address: XCM_DEMO_ADDRESS as `0x${string}`,
    abi: XCM_DEMO_ABI,
    functionName: "hasRole",
    args: keeperRoleRead.data && address ? [keeperRoleRead.data as `0x${string}`, address] : undefined,
    query: {
      enabled: Boolean(keeperRoleRead.data && address),
      refetchInterval: 8_000,
    },
  });

  const weighRead = useReadContract({
    address: XCM_DEMO_ADDRESS as `0x${string}`,
    abi: XCM_DEMO_ABI,
    functionName: "demoWeigh",
    args: [messageHex],
    query: {
      enabled: false,
    },
  });

  const weighDefaultRead = useReadContract({
    address: XCM_DEMO_ADDRESS as `0x${string}`,
    abi: XCM_DEMO_ABI,
    functionName: "weighDefault",
    query: {
      enabled: false,
    },
  });

  const executeWrite = useWriteContract();
  const executeReceipt = useWaitForTransactionReceipt({ hash: executeWrite.data });

  const isKeeper = Boolean(hasKeeperRead.data);

  const precompileAddress = useMemo(() => "0x00000000000000000000000000000000000a0000", []);

  async function weighMessage(): Promise<void> {
    setError(undefined);
    try {
      const response = await weighRead.refetch();
      if (response.data) {
        const [refTime, proofSize] = response.data as [bigint, bigint];
        setResult({ refTime, proofSize });
      }
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  async function weighDefault(): Promise<void> {
    setError(undefined);
    try {
      const response = await weighDefaultRead.refetch();
      if (response.data) {
        const [refTime, proofSize] = response.data as [bigint, bigint];
        setResult({ refTime, proofSize });
      }
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  async function executeMessage(): Promise<void> {
    if (!result) return;
    setError(undefined);

    try {
      const maxRefTime = (result.refTime * 12n) / 10n;
      const maxProofSize = (result.proofSize * 12n) / 10n;

      await executeWrite.writeContractAsync({
        address: XCM_DEMO_ADDRESS,
        abi: XCM_DEMO_ABI,
        functionName: "demoExecute",
        args: [messageHex, maxRefTime, maxProofSize],
      });
    } catch (e) {
      setError(mapContractError(e));
    }
  }

  return {
    precompileAddress,
    isKeeper,
    result,
    error,
    txHash: executeWrite.data,
    txPending: executeReceipt.isLoading,
    txConfirmed: executeReceipt.isSuccess,
    weighMessage,
    weighDefault,
    executeMessage,
  };
}
