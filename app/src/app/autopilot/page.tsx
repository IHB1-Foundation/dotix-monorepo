"use client";

import { useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ConnectCTA } from "@/components/ConnectCTA";
import { CopyableAddress } from "@/components/CopyableAddress";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { SwapPlanTable } from "@/components/SwapPlanTable";
import { TxButton } from "@/components/TxButton";
import { TxStatus } from "@/components/TxStatus";
import { useAgentPlan } from "@/hooks/useAgentPlan";
import { useVaultRoles } from "@/hooks/useVaultRoles";
import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { mapContractError } from "@/lib/errors";

function AutopilotSkeleton() {
  return (
    <section className="space-y-4">
      <div className="card animate-pulse p-4">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-52 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-36 rounded-lg bg-slate-200" />
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-2/3 rounded bg-slate-200" />
        </div>
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-8 w-full rounded bg-slate-200" />
          <div className="h-8 w-full rounded bg-slate-200" />
          <div className="h-8 w-full rounded bg-slate-200" />
        </div>
      </div>
    </section>
  );
}

export default function AutopilotPage() {
  const { isConnected } = useAccount();
  const { plan, file, loading, error, loadPlan } = useAgentPlan();
  const { isStrategist, isKeeper } = useVaultRoles();

  const [actionError, setActionError] = useState<string | undefined>();
  const [confirmAction, setConfirmAction] = useState<"apply-targets" | "execute-rebalance" | null>(null);

  const applyWrite = useWriteContract();
  const executeWrite = useWriteContract();

  const applyReceipt = useWaitForTransactionReceipt({ hash: applyWrite.data });
  const executeReceipt = useWaitForTransactionReceipt({ hash: executeWrite.data });

  const targetEntries = useMemo(() => {
    if (!plan) return [];
    return Object.entries(plan.newTargets);
  }, [plan]);

  if (!isConnected) {
    return (
      <ConnectCTA
        title="Connect your wallet to run the Autopilot strategy workflow"
        description="Generate a plan, apply target weights, and execute rebalances from one connected control surface."
      />
    );
  }

  if (loading && !plan) {
    return <AutopilotSkeleton />;
  }

  async function onApplyTargets(): Promise<void> {
    if (!plan) return;
    setActionError(undefined);

    try {
      const tokens = Object.keys(plan.newTargets) as `0x${string}`[];
      const bps = Object.values(plan.newTargets).map((value) => Number(value));

      await applyWrite.writeContractAsync({
        address: VAULT_ADDRESS,
        abi: INDEX_VAULT_ABI,
        functionName: "setTargetWeights",
        args: [tokens, bps],
      });
    } catch (e) {
      setActionError(mapContractError(e));
    }
  }

  async function onExecuteRebalance(): Promise<void> {
    if (!plan) return;
    setActionError(undefined);

    try {
      const swaps = plan.swaps.map((swap) => ({
        tokenIn: swap.tokenIn as `0x${string}`,
        tokenOut: swap.tokenOut as `0x${string}`,
        amountIn: BigInt(swap.amountIn),
        minAmountOut: BigInt(swap.minAmountOut),
        path: swap.path.map((hop) => hop as `0x${string}`),
      }));

      await executeWrite.writeContractAsync({
        address: VAULT_ADDRESS,
        abi: INDEX_VAULT_ABI,
        functionName: "rebalance",
        args: [swaps],
      });
    } catch (e) {
      setActionError(mapContractError(e));
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader title="Autopilot" description="Generate plans, apply targets, and execute rebalances." />
      <Stepper
        steps={[
          {
            label: "Generate Plan",
            detail: "Build latest swaps and target weights.",
            completed: Boolean(plan),
            active: !plan,
          },
          {
            label: "Apply Targets",
            detail: "Requires STRATEGIST role.",
            completed: applyReceipt.isSuccess,
            active: Boolean(plan) && !applyReceipt.isSuccess,
            locked: !isStrategist,
          },
          {
            label: "Execute Rebalance",
            detail: "Requires KEEPER role.",
            completed: executeReceipt.isSuccess,
            active: Boolean(plan) && applyReceipt.isSuccess && !executeReceipt.isSuccess,
            locked: !isKeeper,
          },
        ]}
      />

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Plan Source</h2>
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
                <CopyableAddress address={token} />
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
            onClick={() => setConfirmAction("apply-targets")}
            loading={applyReceipt.isLoading}
            disabled={!isStrategist || !plan}
          />
          <TxButton
            label="Execute Rebalance"
            variant="danger"
            onClick={() => setConfirmAction("execute-rebalance")}
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

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction === "execute-rebalance" ? "Confirm Execute Rebalance" : "Confirm Apply Targets"}
        description={
          confirmAction === "execute-rebalance"
            ? `You are about to execute rebalance with ${plan?.swaps.length ?? 0} swaps.`
            : `You are about to apply target weights for ${targetEntries.length} assets.`
        }
        confirmLabel={confirmAction === "execute-rebalance" ? "Execute Rebalance" : "Apply Targets"}
        confirmLoading={confirmAction === "execute-rebalance" ? executeReceipt.isLoading : applyReceipt.isLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "execute-rebalance") {
            void onExecuteRebalance();
          } else if (confirmAction === "apply-targets") {
            void onApplyTargets();
          }
          setConfirmAction(null);
        }}
      />
    </section>
  );
}
