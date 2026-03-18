"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ConnectCTA } from "@/components/ConnectCTA";
import { PageHeader } from "@/components/PageHeader";
import { TxButton } from "@/components/TxButton";
import { TxStatus } from "@/components/TxStatus";
import { useDeposit } from "@/hooks/useDeposit";
import { useRedeem } from "@/hooks/useRedeem";
import { explorerTxUrl } from "@/lib/network";

function formatAmount(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(4);
}

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
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div key={`deposit-skeleton-${idx}`} className="card animate-pulse p-5">
          <div className="h-6 w-28 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-48 rounded bg-slate-200" />
          <div className="mt-3 h-10 w-full rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-28 rounded bg-slate-200" />
          <div className="mt-2 h-10 w-full rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-full rounded bg-slate-200" />
          <div className="mt-4 h-10 w-32 rounded-lg bg-slate-200" />
        </div>
      ))}
    </section>
  );
}

export default function DepositPage() {
  const { isConnected } = useAccount();
  const [depositInput, setDepositInput] = useState("");
  const [redeemInput, setRedeemInput] = useState("");
  const [slippagePreset, setSlippagePreset] = useState<(typeof SLIPPAGE_PRESETS)[number] | "custom">("0.5");
  const [customSlippage, setCustomSlippage] = useState("0.5");
  const [redeemSlippagePreset, setRedeemSlippagePreset] = useState<(typeof SLIPPAGE_PRESETS)[number] | "custom">("0.5");
  const [redeemCustomSlippage, setRedeemCustomSlippage] = useState("0.5");
  const [confirmEmergency, setConfirmEmergency] = useState(false);
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

  if (!isConnected) {
    return (
      <ConnectCTA
        title="Connect your wallet to start depositing into the index vault"
        description="After connecting, you can deposit base tokens, mint PDOT shares, and redeem whenever needed."
      />
    );
  }

  if (isConnected && (deposit.isLoading || redeem.isLoading)) {
    return <DepositSkeleton />;
  }

  return (
    <section className="space-y-4">
      <PageHeader title="Deposit & Redeem" description="Deposit base assets to mint PDOT shares, or burn PDOT to redeem." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card relative overflow-hidden p-5">
        <span className="absolute inset-x-0 top-0 h-1 bg-ocean/80" />
        <div className="mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ocean/10 text-ocean">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v12" />
                <path d="m7 11 5 5 5-5" />
              </svg>
            </span>
            Deposit
          </h2>
          <p className="mt-1 text-sm text-slate-600">Convert base token to PDOT shares.</p>
        </div>
        <p className="mb-2 text-sm text-slate-600">Base balance: {formatAmount(deposit.balance, deposit.baseDecimals)} {deposit.baseSymbol}</p>

        <label className="mb-2 block text-sm text-slate-600">Amount</label>
        <div className="relative">
          <input
            className={`input pr-16 ${depositExceedsBalance ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
            value={depositInput}
            onChange={(e) => setDepositInput(sanitizeAmountInput(e.target.value))}
            placeholder="0.0"
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={() => setDepositInput(asInputAmount(deposit.balance, deposit.baseDecimals))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            MAX
          </button>
        </div>
        {depositExceedsBalance && <p className="mt-2 text-sm text-red-600">Exceeds balance</p>}

        <label className="mb-2 mt-3 block text-sm text-slate-600">Slippage (%)</label>
        <div className="flex flex-wrap gap-2 text-sm">
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSlippagePreset(preset)}
              className={`rounded-lg px-3 py-2 font-medium transition ${
                slippagePreset === preset ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {preset}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSlippagePreset("custom")}
            className={`rounded-lg px-3 py-2 font-medium transition ${
              slippagePreset === "custom" ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Custom
          </button>
        </div>
        {slippagePreset === "custom" && (
          <input
            className="input mt-2"
            value={customSlippage}
            onChange={(e) => setCustomSlippage(sanitizeAmountInput(e.target.value))}
            placeholder="0.5"
            inputMode="decimal"
          />
        )}

        {deposit.amountIn > 0n && (
          <div className="mt-3 rounded-lg border border-ocean/30 bg-ocean/5 p-3 text-sm dark:border-ocean/40 dark:bg-ocean/10">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transaction Preview</p>
            <div className="space-y-1 text-slate-700 dark:text-slate-200">
              <div className="flex justify-between">
                <span>You deposit</span>
                <span className="tabular-nums font-medium">{depositInput} {deposit.baseSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>You receive</span>
                <span className="tabular-nums font-medium">~{formatAmount(deposit.expectedShares)} PDOT</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Min received ({slippageInput}% slippage)</span>
                <span className="tabular-nums text-slate-600 dark:text-slate-300">{formatAmount(deposit.minSharesOut)} PDOT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Exchange rate</span>
                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                  1 {deposit.baseSymbol} = {deposit.amountIn > 0n ? (Number(formatAmount(deposit.expectedShares)) / Number(depositInput) || 0).toFixed(4) : "—"} PDOT
                </span>
              </div>
            </div>
          </div>
        )}

        {deposit.amountIn > 0n && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
            <span className={`flex items-center gap-1 ${deposit.approveConfirmed || !deposit.requiresApproval ? "text-mint" : deposit.requiresApproval ? "text-ocean" : "text-slate-400"}`}>
              {deposit.approveConfirmed || !deposit.requiresApproval ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ocean text-white text-[10px]">1</span>
              )}
              Approve
            </span>
            <span className="text-slate-300 dark:text-slate-600">———</span>
            <span className={`flex items-center gap-1 ${deposit.depositConfirmed ? "text-mint" : !deposit.requiresApproval ? "text-ocean" : "text-slate-400"}`}>
              {deposit.depositConfirmed ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              ) : (
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${!deposit.requiresApproval ? "bg-ocean text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>2</span>
              )}
              Deposit
            </span>
          </div>
        )}

        {deposit.approveConfirmed && deposit.requiresApproval && (
          <p className="mt-1 text-xs text-mint">✓ Allowance set — ready to deposit</p>
        )}

        <div className="mt-3 flex gap-2">
          {deposit.requiresApproval ? (
            <TxButton
              label="Approve"
              variant="secondary"
              onClick={deposit.approve}
              loading={deposit.approvePending}
              disabled={!isConnected || deposit.amountIn === 0n || deposit.paused || depositExceedsBalance}
            />
          ) : (
            <TxButton
              label="Deposit"
              onClick={deposit.deposit}
              loading={deposit.depositPending}
              disabled={!isConnected || deposit.amountIn === 0n || deposit.paused || depositExceedsBalance}
            />
          )}
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Why do I need to approve?</summary>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ERC-20 tokens require a separate approval transaction before the vault can spend your funds. This is a standard security pattern — you set an exact allowance, and the vault can never take more than that amount.</p>
        </details>

        <TxStatus
          hash={deposit.requiresApproval ? deposit.approveTxHash : deposit.depositTxHash}
          isPending={deposit.requiresApproval ? deposit.approvePending : deposit.depositPending}
          isConfirmed={deposit.requiresApproval ? deposit.approveConfirmed : deposit.depositConfirmed}
          error={deposit.error}
        />

        {deposit.depositConfirmed && deposit.depositTxHash && (
          <div className="mt-3 rounded-lg border border-mint/30 bg-mint/10 p-4 dark:border-mint/40 dark:bg-mint/15">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-mint">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              Deposit successful!
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              +{formatAmount(deposit.expectedShares)} PDOT added to your balance
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={explorerTxUrl(deposit.depositTxHash)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                View on Explorer
              </a>
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
        </div>

        <div className="card relative overflow-hidden p-5">
        <span className="absolute inset-x-0 top-0 h-1 bg-warning/70" />
        <div className="mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V8" />
                <path d="m17 13-5-5-5 5" />
              </svg>
            </span>
            Redeem
          </h2>
          <p className="mt-1 text-sm text-slate-600">Burn PDOT shares to receive base token.</p>
        </div>
        <p className="mb-2 text-sm text-slate-600">PDOT balance: {formatAmount(redeem.pdotBalance)}</p>

        <label className="mb-2 block text-sm text-slate-600">PDOT Amount</label>
        <div className="relative">
          <input
            className={`input pr-16 ${redeemExceedsBalance ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
            value={redeemInput}
            onChange={(e) => setRedeemInput(sanitizeAmountInput(e.target.value))}
            placeholder="0.0"
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={() => setRedeemInput(asInputAmount(redeem.pdotBalance))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            MAX
          </button>
        </div>
        {redeemExceedsBalance && <p className="mt-2 text-sm text-red-600">Exceeds balance</p>}

        <label className="mb-2 mt-3 block text-sm text-slate-600">Slippage (%)</label>
        <div className="flex flex-wrap gap-2 text-sm">
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRedeemSlippagePreset(preset)}
              className={`rounded-lg px-3 py-2 font-medium transition ${
                redeemSlippagePreset === preset ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {preset}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRedeemSlippagePreset("custom")}
            className={`rounded-lg px-3 py-2 font-medium transition ${
              redeemSlippagePreset === "custom" ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Custom
          </button>
        </div>
        {redeemSlippagePreset === "custom" && (
          <input
            className="input mt-2"
            value={redeemCustomSlippage}
            onChange={(e) => setRedeemCustomSlippage(sanitizeAmountInput(e.target.value))}
            placeholder="0.5"
            inputMode="decimal"
          />
        )}

        {redeem.sharesIn > 0n && (
          <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm dark:border-warning/40 dark:bg-warning/10">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transaction Preview</p>
            <div className="space-y-1 text-slate-700 dark:text-slate-200">
              <div className="flex justify-between">
                <span>You burn</span>
                <span className="tabular-nums font-medium">{redeemInput} PDOT</span>
              </div>
              <div className="flex justify-between">
                <span>You receive</span>
                <span className="tabular-nums font-medium">~{formatAmount(redeem.expectedBaseOut)} {deposit.baseSymbol}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Min received ({redeemSlippageInput}% slippage)</span>
                <span className="tabular-nums text-slate-600 dark:text-slate-300">{formatAmount(redeem.minBaseOut)} {deposit.baseSymbol}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <TxButton
            label="Redeem"
            onClick={redeem.redeem}
            loading={redeem.redeemPending}
            disabled={!isConnected || redeem.sharesIn === 0n || redeemExceedsBalance}
          />
          {redeem.paused && (
            <TxButton
              label="Emergency Redeem"
              variant="danger"
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
          <div className="mt-3 rounded-lg border border-mint/30 bg-mint/10 p-4 dark:border-mint/40 dark:bg-mint/15">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-mint">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              Redeem successful!
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
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  View on Explorer
                </a>
              )}
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
        </div>
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
