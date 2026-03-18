"use client";

import { TxStatus } from "@/components/TxStatus";
import type { WeighResult } from "@/hooks/useXcmDemo";

function formatNum(n: bigint | number): string {
  return Number(n).toLocaleString("en-US");
}

export function XcmResult({
  result,
  txHash,
  txPending,
  txConfirmed,
  error,
}: {
  result: WeighResult;
  txHash?: string;
  txPending?: boolean;
  txConfirmed?: boolean;
  error?: string;
}) {
  return (
    <div className={`card p-4 transition-colors ${txConfirmed ? "border-mint/40 bg-mint/5 dark:border-mint/30 dark:bg-mint/10" : ""}`}>
      <div className="mb-3 flex items-center gap-2">
        {txConfirmed ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-mint" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 13h4" />
          </svg>
        )}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Weigh Result</h3>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ref Time</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink dark:text-slate-100">{formatNum(result.refTime)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">computational units</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Proof Size</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink dark:text-slate-100">{formatNum(result.proofSize)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">bytes of proof</p>
          </div>
          <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
            These values represent the computational cost of executing this XCM message on-chain. Higher refTime = more compute; higher proofSize = more storage proof.
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Weigh a message to see execution cost estimate.</p>
      )}

      <TxStatus hash={txHash} isPending={txPending} isConfirmed={txConfirmed} error={error} />
    </div>
  );
}
