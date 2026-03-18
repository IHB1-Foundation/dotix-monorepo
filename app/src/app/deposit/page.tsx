"use client";

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
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const slippageInput = slippagePreset === "custom" ? customSlippage : slippagePreset;

  const slippagePct = useMemo(() => {
    const n = Number(slippageInput);
    return Number.isFinite(n) && n >= 0 ? n : 0.5;
  }, [slippageInput]);

  const deposit = useDeposit(depositInput, slippagePct);
  const redeem = useRedeem(redeemInput, slippagePct);
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
      <PageHeader title="Deposit" description="Deposit base assets into the vault or redeem PDOT shares." />

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
            className={`w-full rounded-lg border px-3 py-2 pr-16 ${depositExceedsBalance ? "border-red-400" : "border-slate-300"}`}
            value={depositInput}
            onChange={(e) => setDepositInput(sanitizeAmountInput(e.target.value))}
            placeholder="0.0"
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={() => setDepositInput(asInputAmount(deposit.balance, deposit.baseDecimals))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
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
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={customSlippage}
            onChange={(e) => setCustomSlippage(sanitizeAmountInput(e.target.value))}
            placeholder="0.5"
            inputMode="decimal"
          />
        )}

        <p className="mt-3 text-sm text-slate-600">
          Expected shares: {formatAmount(deposit.expectedShares)} / Min shares out: {formatAmount(deposit.minSharesOut)}
        </p>

        <div className="mt-4 flex gap-2">
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

        <TxStatus
          hash={deposit.requiresApproval ? deposit.approveTxHash : deposit.depositTxHash}
          isPending={deposit.requiresApproval ? deposit.approvePending : deposit.depositPending}
          isConfirmed={deposit.requiresApproval ? deposit.approveConfirmed : deposit.depositConfirmed}
          error={deposit.error}
        />
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
            className={`w-full rounded-lg border px-3 py-2 pr-16 ${redeemExceedsBalance ? "border-red-400" : "border-slate-300"}`}
            value={redeemInput}
            onChange={(e) => setRedeemInput(sanitizeAmountInput(e.target.value))}
            placeholder="0.0"
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={() => setRedeemInput(asInputAmount(redeem.pdotBalance))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            MAX
          </button>
        </div>
        {redeemExceedsBalance && <p className="mt-2 text-sm text-red-600">Exceeds balance</p>}

        <p className="mt-3 text-sm text-slate-600">
          Expected base out: {formatAmount(redeem.expectedBaseOut)} / Min base out: {formatAmount(redeem.minBaseOut)}
        </p>

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
