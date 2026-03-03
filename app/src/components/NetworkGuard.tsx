"use client";

import { useMemo } from "react";
import { useChainId, useSwitchChain } from "wagmi";

const REQUIRED_CHAIN_ID = 420420417;

export function NetworkGuard() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const mismatch = useMemo(() => {
    if (!chainId) {
      return false;
    }

    return chainId !== REQUIRED_CHAIN_ID;
  }, [chainId]);

  if (!mismatch) {
    return null;
  }

  return (
    <div className="card mb-4 border-warning/60 p-4">
      <p className="font-medium">Wrong network detected.</p>
      <p className="text-sm text-slate-600">Please switch to Polkadot Hub TestNet (chainId 420420417).</p>
      <button
        type="button"
        className="mt-3 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white"
        onClick={() => switchChain({ chainId: REQUIRED_CHAIN_ID })}
        disabled={isPending}
      >
        {isPending ? "Switching..." : "Switch to Polkadot Hub"}
      </button>
    </div>
  );
}
