"use client";

import { useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { ExplanationPanel } from "@/components/ExplanationPanel";
import { SwapPlanTable } from "@/components/SwapPlanTable";
import { TxButton } from "@/components/TxButton";
import { TxStatus } from "@/components/TxStatus";
import { useAgentPlan } from "@/hooks/useAgentPlan";
import { useVaultRoles } from "@/hooks/useVaultRoles";
import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { mapContractError } from "@/lib/errors";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AutopilotPage() {
  const { plan, file, loading, error, loadPlan } = useAgentPlan();
  const { isStrategist, isKeeper } = useVaultRoles();

  const [actionError, setActionError] = useState<string | undefined>();

  const applyWrite = useWriteContract();
  const executeWrite = useWriteContract();

  const applyReceipt = useWaitForTransactionReceipt({ hash: applyWrite.data });
  const executeReceipt = useWaitForTransactionReceipt({ hash: executeWrite.data });

  const targetEntries = useMemo(() => {
    if (!plan) return [];
    return Object.entries(plan.newTargets);
  }, [plan]);

  async function onApplyTargets(): Promise<void> {
    if (!plan) return;
    setActionError(undefined);

    try {
      const tokens = Object.keys(plan.newTargets) as `0x${string}`[];
      const bps = Object.values(plan.newTargets).map((value) => Number(value));

      await applyWrite.writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: INDEX_VAULT_ABI,
        functionName: "setTargetWeights",
        args: [tokens, bps],
      } as any);
    } catch (e) {
      setActionError(mapContractError(e));
    }
  }

  async function onExecuteRebalance(): Promise<void> {
    if (!plan) return;
    setActionError(undefined);

    try {
      const swaps = plan.swaps.map((swap) => ({
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        amountIn: BigInt(swap.amountIn),
        minAmountOut: BigInt(swap.minAmountOut),
        path: swap.path,
      }));

      await executeWrite.writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: INDEX_VAULT_ABI,
        functionName: "rebalance",
        args: [swaps],
      } as any);
    } catch (e) {
      setActionError(mapContractError(e));
    }
  }

  return (
    <section className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Autopilot</h2>
            <p className="text-sm text-slate-600">Latest plan file: {file ?? "none"}</p>
          </div>
          <TxButton label="Generate Plan" onClick={() => void loadPlan()} loading={loading} />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Proposed Target Weights</h3>
        {targetEntries.length === 0 ? (
          <p className="text-sm text-slate-600">No targets available.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {targetEntries.map(([token, bps]) => (
              <li key={token} className="flex justify-between">
                <span>{shortAddress(token)}</span>
                <span>{(bps / 100).toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SwapPlanTable swaps={plan?.swaps ?? []} />
      <ExplanationPanel lines={plan?.explanation ?? []} />

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <TxButton
            label="Apply Targets"
            onClick={() => void onApplyTargets()}
            loading={applyReceipt.isLoading}
            disabled={!isStrategist || !plan}
          />
          <TxButton
            label="Execute Rebalance"
            onClick={() => void onExecuteRebalance()}
            loading={executeReceipt.isLoading}
            disabled={!isKeeper || !plan}
          />
        </div>
        {!isStrategist && <p className="mt-2 text-xs text-slate-500">Apply Targets requires STRATEGIST_ROLE.</p>}
        {!isKeeper && <p className="mt-1 text-xs text-slate-500">Execute Rebalance requires KEEPER_ROLE.</p>}

        <TxStatus
          hash={applyWrite.data ?? executeWrite.data}
          isPending={applyReceipt.isLoading || executeReceipt.isLoading}
          isConfirmed={applyReceipt.isSuccess || executeReceipt.isSuccess}
          error={actionError}
        />
      </div>
    </section>
  );
}
