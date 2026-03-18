"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";

import { VAULT_ADDRESS } from "@/lib/contracts";
import { APP_CHAIN_ID } from "@/lib/network";

export type NAVPoint = {
  blockNumber: number;
  nav: number; // in base units (human readable)
};

const REBALANCED_EVENT = parseAbiItem(
  "event Rebalanced(uint256 navAfter)"
);

const RANGE_BLOCKS: Record<string, bigint> = {
  "24h": 7200n,  // ~12s blocks → ~7200 blocks/day
  "7d": 50400n,
  "30d": 216000n,
  all: 500000n,
};

export function useNAVHistory(range: string) {
  const client = usePublicClient({ chainId: APP_CHAIN_ID });
  const [points, setPoints] = useState<NAVPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    async function fetch() {
      if (!client) return;
      setLoading(true);
      try {
        const latest = await client.getBlockNumber();
        const lookback = RANGE_BLOCKS[range] ?? RANGE_BLOCKS["7d"];
        const fromBlock = latest > lookback ? latest - lookback : 0n;

        const logs = await client.getLogs({
          address: VAULT_ADDRESS,
          event: REBALANCED_EVENT,
          fromBlock,
        });

        if (cancelled) return;

        const pts: NAVPoint[] = logs.map((log) => ({
          blockNumber: Number(log.blockNumber),
          nav: log.args.navAfter ? Number(formatUnits(log.args.navAfter, 18)) : 0,
        }));

        setPoints(pts);
      } catch {
        setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetch();
    return () => {
      cancelled = true;
    };
  }, [client, range]);

  return { points, loading };
}
