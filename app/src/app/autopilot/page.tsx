"use client";

import { useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ConnectCTA } from "@/components/ConnectCTA";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { SwapPlanTable } from "@/components/SwapPlanTable";
import { TxButton } from "@/components/TxButton";
import { TxStatus } from "@/components/TxStatus";
import { useAgentPlan } from "@/hooks/useAgentPlan";
import { useVaultRoles } from "@/hooks/useVaultRoles";
import { useVaultState } from "@/hooks/useVaultState";
import { useTokenMeta } from "@/hooks/useTokenMeta";
import { INDEX_VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts";
import { mapContractError } from "@/lib/errors";
import { formatPercent } from "@/lib/format";

function AutopilotSkeleton() {
  return (
    <section className="space-y-4">
      <div className="card animate-pulse p-4">
        <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-52 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <div className="card animate-pulse p-4">
        <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 space-y-2">
          <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </section>
  );
}

export default function AutopilotPage() {
  const { isConnected } = useAccount();
  const { plan, file, loading, error, loadPlan } = useAgentPlan();
  const { isStrategist, isKeeper } = useVaultRoles();
  const vault = useVaultState();
  const { byToken } = useTokenMeta(vault.assets.map((a) => a.token));

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
      {!isConnected && <ConnectCTA variant="inline" description="Connect your wallet to apply targets and execute rebalances." />}
      {isConnected && (
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isStrategist ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isStrategist ? "bg-success" : "bg-slate-400"}`} />
            STRATEGIST {isStrategist ? "✓" : "✗"}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isKeeper ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isKeeper ? "bg-success" : "bg-slate-400"}`} />
            KEEPER {isKeeper ? "✓" : "✗"}
          </span>
        </div>
      )}
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

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Autopilot Plan</h2>
            {plan?.timestamp ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generated at {new Date(plan.timestamp).toLocaleTimeString()} (
                {Math.round((Date.now() - new Date(plan.timestamp).getTime()) / 60000)} min ago)
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No plan loaded — click Generate Plan</p>
            )}
            {plan && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {plan.swaps.length} swap{plan.swaps.length !== 1 ? "s" : ""} proposed
                {Object.keys(plan.newTargets).length > 0 ? `, ${Object.keys(plan.newTargets).length} assets targeted` : ""}
              </p>
            )}
            <details className="mt-1">
              <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">Show file</summary>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{file ?? "none"}</p>
            </details>
          </div>
          <TxButton label="Generate Plan" onClick={() => void loadPlan()} loading={loading} />
        </div>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Weight Comparison</h3>
        {targetEntries.length === 0 ? (
          <div className="flex items-center justify-between gap-4 py-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">No targets available. Generate a plan first.</p>
            <Button
              size="sm"
              onClick={() => void loadPlan()}
              disabled={loading}
              className="shrink-0"
            >
              Generate Plan
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-2 sm:hidden">
              {targetEntries.map(([token, proposedBps]) => {
                const current = vault.assets.find((a) => a.token.toLowerCase() === token.toLowerCase());
                const currentBps = current?.currentBps ?? 0;
                const delta = proposedBps - currentBps;
                const symbol = byToken[token]?.symbol ?? byToken[token.toLowerCase()]?.symbol ?? `${token.slice(0, 6)}…${token.slice(-4)}`;
                return (
                  <div key={token} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{symbol}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-slate-500">Current</span>
                        <span className="tabular-nums">{formatPercent(currentBps)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Proposed</span>
                        <span className="tabular-nums">{formatPercent(proposedBps)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Delta</span>
                        <span className={`tabular-nums font-semibold ${delta > 0 ? "text-mint" : delta < 0 ? "text-warning" : "text-slate-400"}`}>
                          {delta > 0 ? "+" : ""}{formatPercent(Math.abs(delta))} {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: table */}
            <div className="relative -mx-4 hidden overflow-x-auto px-4 sm:mx-0 sm:block sm:px-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Asset</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Proposed</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {targetEntries.map(([token, proposedBps]) => {
                    const current = vault.assets.find((a) => a.token.toLowerCase() === token.toLowerCase());
                    const currentBps = current?.currentBps ?? 0;
                    const delta = proposedBps - currentBps;
                    const symbol = byToken[token]?.symbol ?? byToken[token.toLowerCase()]?.symbol ?? `${token.slice(0, 6)}…${token.slice(-4)}`;
                    return (
                      <tr key={token} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 font-medium text-ink dark:text-slate-100">{symbol}</td>
                        <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatPercent(currentBps)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatPercent(proposedBps)}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold ${delta > 0 ? "text-mint" : delta < 0 ? "text-warning" : "text-slate-400"}`}>
                          {delta > 0 ? "+" : ""}{formatPercent(Math.abs(delta))} {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <SwapPlanTable swaps={plan?.swaps ?? []} />
      <ExplanationPanel lines={plan?.explanation ?? []} />

      <Card>
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
      </Card>

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
