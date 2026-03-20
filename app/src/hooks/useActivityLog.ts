"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";

import { VAULT_ADDRESS } from "@/lib/contracts";
import { APP_CHAIN_ID } from "@/lib/network";

export type ActivityEntry = {
  type: "Deposit" | "Redeem" | "Rebalanced";
  txHash: `0x${string}`;
  blockNumber: bigint;
  user?: string;
  amount?: string;
  label: string;
};

const DEPOSIT_EVENT = parseAbiItem(
  "event Deposit(address indexed user, uint256 baseIn, uint256 sharesOut)"
);
const REDEEM_EVENT = parseAbiItem(
  "event Redeem(address indexed user, uint256 sharesIn, uint256 baseOut)"
);
const REBALANCED_EVENT = parseAbiItem(
  "event Rebalanced(uint256 navAfter)"
);

const LOOK_BACK_BLOCKS = 5000n;

export function useActivityLog(limit = 10) {
  const client = usePublicClient({ chainId: APP_CHAIN_ID });
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    async function fetch() {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const latest = await client.getBlockNumber();
        const fromBlock = latest > LOOK_BACK_BLOCKS ? latest - LOOK_BACK_BLOCKS : 0n;

        const [depositLogs, redeemLogs, rebalancedLogs] = await Promise.all([
          client.getLogs({ address: VAULT_ADDRESS, event: DEPOSIT_EVENT, fromBlock }),
          client.getLogs({ address: VAULT_ADDRESS, event: REDEEM_EVENT, fromBlock }),
          client.getLogs({ address: VAULT_ADDRESS, event: REBALANCED_EVENT, fromBlock }),
        ]);

        if (cancelled) return;

        const combined: ActivityEntry[] = [
          ...depositLogs.map((log) => ({
            type: "Deposit" as const,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            user: log.args.user,
            amount: log.args.sharesOut
              ? `+${Number(formatUnits(log.args.sharesOut, 18)).toFixed(4)} DOTIX`
              : undefined,
            label: `Deposit — ${log.args.baseIn ? Number(formatUnits(log.args.baseIn, 18)).toFixed(4) : "?"} base`,
          })),
          ...redeemLogs.map((log) => ({
            type: "Redeem" as const,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            user: log.args.user,
            amount: log.args.baseOut
              ? `-${Number(formatUnits(log.args.baseOut, 18)).toFixed(4)} base`
              : undefined,
            label: `Redeem — ${log.args.sharesIn ? Number(formatUnits(log.args.sharesIn, 18)).toFixed(4) : "?"} DOTIX`,
          })),
          ...rebalancedLogs.map((log) => ({
            type: "Rebalanced" as const,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            label: `Rebalanced`,
          })),
        ];

        combined.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        setEntries(combined.slice(0, limit));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetch();
    return () => {
      cancelled = true;
    };
  }, [client, limit]);

  return { entries, loading, error };
}
