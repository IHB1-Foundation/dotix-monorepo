"use client";

import { TxStatus } from "@/components/TxStatus";
import type { WeighResult } from "@/hooks/useXcmDemo";

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
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Weigh Result</h3>
      <p className="text-sm text-slate-700">refTime: {result ? result.refTime.toString() : "-"}</p>
      <p className="text-sm text-slate-700">proofSize: {result ? result.proofSize.toString() : "-"}</p>
      <TxStatus hash={txHash} isPending={txPending} isConfirmed={txConfirmed} error={error} />
    </div>
  );
}
