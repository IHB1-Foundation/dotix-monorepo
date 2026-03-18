"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ToggleGroup } from "@/components/ToggleGroup";
import { ConnectCTA } from "@/components/ConnectCTA";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { TxButton } from "@/components/TxButton";
import { TxPreview } from "@/components/TxPreview";
import { TxStatus } from "@/components/TxStatus";
import { useDeposit } from "@/hooks/useDeposit";
import { useRedeem } from "@/hooks/useRedeem";
import { explorerTxUrl } from "@/lib/network";
import { formatTokenStr } from "@/lib/format";

const formatAmount = formatTokenStr;

function sanitizeAmountInput(value: string): string {
  const normalized = value.replace(/,/g, ".");
  let next = "";
  let hasDot = false;

  for (const char of normalized) {
    if (/\d/.test(char)) {
      next += char;
      continue;
    }

    if (char === "." && !hasDot) {
      hasDot = true;
      next += char;
    }
  }

  return next;
}

function asInputAmount(value: bigint, decimals = 18): string {
  const formatted = formatUnits(value, decimals);
  return formatted.includes(".") ? formatted.replace(/\.?0+$/, "") : formatted;
}

const SLIPPAGE_PRESETS = ["0.1", "0.5", "1.0"] as const;

function DepositSkeleton() {
  return (
    <section className="mx-auto max-w-[560px] space-y-6">
      <div className="card animate-pulse p-5">
        <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </section>
  );
}

export default function DepositPage() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<"deposit" | "redeem">(
    tabParam === "redeem" ? "redeem" : "deposit"
  );

  function switchTab(tab: "deposit" | "redeem") {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (tab === "redeem") {
      params.set("tab", "redeem");
    } else {
      params.delete("tab");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const [depositInput, setDepositInput] = useState("");
  const [redeemInput, setRedeemInput] = useState("");
  const [slippagePreset, setSlippagePreset] = useState<(typeof SLIPPAGE_PRESETS)[number] | "custom">("0.5");
  const [customSlippage, setCustomSlippage] = useState("0.5");
  const [redeemSlippagePreset, setRedeemSlippagePreset] = useState<(typeof SLIPPAGE_PRESETS)[number] | "custom">("0.5");
  const [redeemCustomSlippage, setRedeemCustomSlippage] = useState("0.5");
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [depositSlippageOpen, setDepositSlippageOpen] = useState(false);
  const [redeemSlippageOpen, setRedeemSlippageOpen] = useState(false);
  const slippageInput = slippagePreset === "custom" ? customSlippage : slippagePreset;
  const redeemSlippageInput = redeemSlippagePreset === "custom" ? redeemCustomSlippage : redeemSlippagePreset;

  const slippagePct = useMemo(() => {
    const n = Number(slippageInput);
    return Number.isFinite(n) && n >= 0 ? n : 0.5;
  }, [slippageInput]);

  const redeemSlippagePct = useMemo(() => {
    const n = Number(redeemSlippageInput);
    return Number.isFinite(n) && n >= 0 ? n : 0.5;
  }, [redeemSlippageInput]);

  const deposit = useDeposit(depositInput, slippagePct);
  const redeem = useRedeem(redeemInput, redeemSlippagePct);
  const depositExceedsBalance = deposit.amountIn > deposit.balance;
  const redeemExceedsBalance = redeem.sharesIn > redeem.pdotBalance;

  if (isConnected && (deposit.isLoading || redeem.isLoading)) {
    return <DepositSkeleton />;
  }

  return (
    <section className="mx-auto max-w-[560px] space-y-6">
      <PageHeader title="Stake & Unstake" description="Stake PAS, receive PDOT." />

      {!isConnected && <ConnectCTA variant="inline" description="Connect your wallet to stake PAS and mint PDOT shares." />}

      {/* Tab toggle */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => switchTab("deposit")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
            activeTab === "deposit"
              ? "bg-white text-ocean shadow-sm dark:bg-slate-900 dark:text-ocean-light"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v12" /><path d="m7 11 5 5 5-5" />
          </svg>
          Stake
        </button>
        <button
          type="button"
          onClick={() => switchTab("redeem")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
            activeTab === "redeem"
              ? "bg-white text-warning shadow-sm dark:bg-slate-900 dark:text-warning-light"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20V8" /><path d="m17 13-5-5-5 5" />
          </svg>
          Unstake
        </button>
      </div>

      {/* Tab content with fade transition */}
      <div className="page-transition">
      {activeTab === "deposit" && (
        <Card padding="spacious">
          {/* Amount input — Lido style: large number, balance inside */}
          <div className={`rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 ${depositExceedsBalance ? "ring-2 ring-error/60" : "focus-within:ring-2 focus-within:ring-ocean/30"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</span>
              <button
                type="button"
                onClick={() => setDepositInput(asInputAmount(deposit.balance, deposit.baseDecimals))}
                className="text-xs font-semibold text-ocean hover:text-ocean-dark dark:text-ocean-light"
              >
                Available: {formatAmount(deposit.balance, deposit.baseDecimals)} {deposit.baseSymbol}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="deposit-amount"
                className="min-w-0 flex-1 bg-transparent text-2xl font-bold tabular-nums text-ink placeholder:text-slate-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-600"
                value={depositInput}
                onChange={(e) => setDepositInput(sanitizeAmountInput(e.target.value))}
                placeholder="0"
                inputMode="decimal"
                style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}
              />
              <span className="shrink-0 text-sm font-semibold text-slate-500">{deposit.baseSymbol}</span>
            </div>
          </div>
          {depositExceedsBalance && <p className="mt-2 text-sm text-error">Exceeds balance</p>}
          {!depositExceedsBalance && deposit.amountIn > 0n && (
            <p className="mt-1.5 text-xs text-muted">
              ≈ {formatAmount(deposit.expectedShares)} PDOT
            </p>
          )}

          {/* Slippage */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setDepositSlippageOpen((o) => !o)}
              className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <span>Slippage tolerance: {slippageInput}%</span>
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${depositSlippageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {depositSlippageOpen && (
              <div className="mt-2">
                <ToggleGroup
                  items={[
                    ...SLIPPAGE_PRESETS.map((p) => ({ value: p as string, label: `${p}%` })),
                    { value: "custom", label: "Custom" },
                  ]}
                  value={slippagePreset}
                  onChange={(v) => setSlippagePreset(v as typeof slippagePreset)}
                />
                {slippagePreset === "custom" && (
                  <input
                    className="input mt-2"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(sanitizeAmountInput(e.target.value))}
                    placeholder="0.5"
                    inputMode="decimal"
                  />
                )}
              </div>
            )}
          </div>

          {/* Tx preview — inline, no box */}
          {deposit.amountIn > 0n && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">You will receive</span>
                <span className="font-semibold tabular-nums">~{formatAmount(deposit.expectedShares)} PDOT</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Min received ({slippageInput}% slippage)</span>
                <span className="tabular-nums">{formatAmount(deposit.minSharesOut)} PDOT</span>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Exchange rate</summary>
                <p className="mt-1 text-slate-400">
                  1 {deposit.baseSymbol} = {deposit.amountIn > 0n ? (Number(formatAmount(deposit.expectedShares)) / Number(depositInput) || 0).toFixed(4) : "—"} PDOT
                </p>
              </details>
            </div>
          )}

          {/* Stepper */}
          {deposit.amountIn > 0n && (
            <div className="mt-4">
              <Stepper
                steps={[
                  {
                    label: "Approve",
                    detail: deposit.requiresApproval ? "Allow vault to spend your tokens." : "Already approved.",
                    completed: deposit.approveConfirmed || !deposit.requiresApproval,
                    active: deposit.requiresApproval && !deposit.approveConfirmed,
                  },
                  {
                    label: "Stake",
                    detail: "Mint PDOT shares.",
                    completed: deposit.depositConfirmed,
                    active: !deposit.requiresApproval || deposit.approveConfirmed,
                  },
                ]}
              />
            </div>
          )}

          {/* CTA — full-width */}
          <div className="mt-5">
            {deposit.requiresApproval ? (
              <TxButton
                label="Approve"
                variant="secondary"
                fullWidth
                onClick={deposit.approve}
                loading={deposit.approvePending}
                disabled={!isConnected || deposit.amountIn === 0n || deposit.paused || depositExceedsBalance}
              />
            ) : (
              <TxButton
                label="Stake"
                fullWidth
                onClick={deposit.deposit}
                loading={deposit.depositPending}
                disabled={!isConnected || deposit.amountIn === 0n || deposit.paused || depositExceedsBalance}
              />
            )}
          </div>

          <TxStatus
            hash={deposit.requiresApproval ? deposit.approveTxHash : deposit.depositTxHash}
            isPending={deposit.requiresApproval ? deposit.approvePending : deposit.depositPending}
            isConfirmed={deposit.requiresApproval ? deposit.approveConfirmed : deposit.depositConfirmed}
            error={deposit.error}
          />

          {deposit.depositConfirmed && deposit.depositTxHash && (
            <div className="mt-4 rounded-2xl border border-mint/30 bg-mint/10 p-4 dark:border-mint/40 dark:bg-mint/15">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-mint">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path className="check-animate" d="M20 6 9 17l-5-5" /></svg>
                Stake successful!
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                +{formatAmount(deposit.expectedShares)} PDOT added to your balance
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={explorerTxUrl(deposit.depositTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  View on Explorer
                </a>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-ocean px-3 py-1.5 text-xs font-bold text-white transition hover:bg-ocean-dark"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "redeem" && (
        <Card padding="spacious">
          {/* Amount input — Lido style */}
          <div className={`rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 ${redeemExceedsBalance ? "ring-2 ring-error/60" : "focus-within:ring-2 focus-within:ring-warning/30"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</span>
              <button
                type="button"
                onClick={() => setRedeemInput(asInputAmount(redeem.pdotBalance))}
                className="text-xs font-semibold text-warning hover:text-warning-dark dark:text-warning-light"
              >
                Available: {formatAmount(redeem.pdotBalance)} PDOT
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="redeem-amount"
                className="min-w-0 flex-1 bg-transparent text-2xl font-bold tabular-nums text-ink placeholder:text-slate-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-600"
                value={redeemInput}
                onChange={(e) => setRedeemInput(sanitizeAmountInput(e.target.value))}
                placeholder="0"
                inputMode="decimal"
                style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}
              />
              <span className="shrink-0 text-sm font-semibold text-slate-500">PDOT</span>
            </div>
          </div>
          {redeemExceedsBalance && <p className="mt-2 text-sm text-error">Exceeds balance</p>}
          {!redeemExceedsBalance && redeem.sharesIn > 0n && (
            <p className="mt-1.5 text-xs text-muted">
              ≈ {formatAmount(redeem.expectedBaseOut)} {deposit.baseSymbol}
            </p>
          )}

          {/* Slippage */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setRedeemSlippageOpen((o) => !o)}
              className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <span>Slippage tolerance: {redeemSlippageInput}%</span>
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${redeemSlippageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {redeemSlippageOpen && (
              <div className="mt-2">
                <ToggleGroup
                  items={[
                    ...SLIPPAGE_PRESETS.map((p) => ({ value: p as string, label: `${p}%` })),
                    { value: "custom", label: "Custom" },
                  ]}
                  value={redeemSlippagePreset}
                  onChange={(v) => setRedeemSlippagePreset(v as typeof redeemSlippagePreset)}
                />
                {redeemSlippagePreset === "custom" && (
                  <input
                    className="input mt-2"
                    value={redeemCustomSlippage}
                    onChange={(e) => setRedeemCustomSlippage(sanitizeAmountInput(e.target.value))}
                    placeholder="0.5"
                    inputMode="decimal"
                  />
                )}
              </div>
            )}
          </div>

          {/* Tx preview — inline */}
          {redeem.sharesIn > 0n && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">You will receive</span>
                <span className="font-semibold tabular-nums">~{formatAmount(redeem.expectedBaseOut)} {deposit.baseSymbol}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Min received ({redeemSlippageInput}% slippage)</span>
                <span className="tabular-nums">{formatAmount(redeem.minBaseOut)} {deposit.baseSymbol}</span>
              </div>
            </div>
          )}

          {/* CTA — full-width */}
          <div className="mt-5 flex flex-col gap-3">
            <TxButton
              label="Unstake"
              fullWidth
              onClick={redeem.redeem}
              loading={redeem.redeemPending}
              disabled={!isConnected || redeem.sharesIn === 0n || redeemExceedsBalance}
            />
            {redeem.paused && (
              <TxButton
                label="Emergency Redeem"
                variant="danger"
                fullWidth
                onClick={() => setConfirmEmergency(true)}
                loading={redeem.emergencyPending}
                disabled={!isConnected || redeem.sharesIn === 0n || redeemExceedsBalance}
              />
            )}
          </div>

          <TxStatus
            hash={redeem.emergencyTxHash ?? redeem.redeemTxHash}
            isPending={redeem.emergencyPending || redeem.redeemPending}
            isConfirmed={redeem.emergencyConfirmed || redeem.redeemConfirmed}
            error={redeem.error}
          />

          {(redeem.redeemConfirmed || redeem.emergencyConfirmed) && (redeem.redeemTxHash ?? redeem.emergencyTxHash) && (
            <div className="mt-4 rounded-2xl border border-mint/30 bg-mint/10 p-4 dark:border-mint/40 dark:bg-mint/15">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-mint">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                Unstake successful!
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                ~{formatAmount(redeem.expectedBaseOut)} {deposit.baseSymbol} returned to your wallet
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(redeem.redeemTxHash ?? redeem.emergencyTxHash) && (
                  <a
                    href={explorerTxUrl((redeem.redeemTxHash ?? redeem.emergencyTxHash)!)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    View on Explorer
                  </a>
                )}
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-ocean px-3 py-1.5 text-xs font-bold text-white transition hover:bg-ocean-dark"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}
      </div>

      <ConfirmModal
        open={confirmEmergency}
        title="Confirm Emergency Redeem"
        description="You are about to bypass standard redeem flow and withdraw underlying assets immediately."
        confirmLabel="Emergency Redeem"
        confirmLoading={redeem.emergencyPending}
        onCancel={() => setConfirmEmergency(false)}
        onConfirm={() => {
          void redeem.emergencyRedeem();
          setConfirmEmergency(false);
        }}
      />
    </section>
  );
}
