"use client";

import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { TxButton } from "@/components/TxButton";
import { TxStatus } from "@/components/TxStatus";
import { useDeposit } from "@/hooks/useDeposit";
import { useRedeem } from "@/hooks/useRedeem";

function formatAmount(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(4);
}

export default function DepositPage() {
  const { isConnected } = useAccount();
  const [depositInput, setDepositInput] = useState("");
  const [redeemInput, setRedeemInput] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const slippagePct = useMemo(() => {
    const n = Number(slippage);
    return Number.isFinite(n) && n >= 0 ? n : 0.5;
  }, [slippage]);

  const deposit = useDeposit(depositInput, slippagePct);
  const redeem = useRedeem(redeemInput, slippagePct);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Deposit</h2>
        <p className="mb-2 text-sm text-slate-600">Base balance: {formatAmount(deposit.balance, deposit.baseDecimals)} {deposit.baseSymbol}</p>

        <label className="mb-2 block text-sm text-slate-600">Amount</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={depositInput}
          onChange={(e) => setDepositInput(e.target.value)}
          placeholder="0.0"
        />

        <label className="mb-2 mt-3 block text-sm text-slate-600">Slippage (%)</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
          placeholder="0.5"
        />

        <p className="mt-3 text-sm text-slate-600">
          Expected shares: {formatAmount(deposit.expectedShares)} / Min shares out: {formatAmount(deposit.minSharesOut)}
        </p>

        <div className="mt-4 flex gap-2">
          {deposit.requiresApproval ? (
            <TxButton
              label="Approve"
              onClick={deposit.approve}
              loading={deposit.approvePending}
              disabled={!isConnected || deposit.amountIn === 0n || deposit.paused}
            />
          ) : (
            <TxButton
              label="Deposit"
              onClick={deposit.deposit}
              loading={deposit.depositPending}
              disabled={!isConnected || deposit.amountIn === 0n || deposit.paused}
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

      <div className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Redeem</h2>
        <p className="mb-2 text-sm text-slate-600">PDOT balance: {formatAmount(redeem.pdotBalance)}</p>

        <label className="mb-2 block text-sm text-slate-600">PDOT Amount</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={redeemInput}
          onChange={(e) => setRedeemInput(e.target.value)}
          placeholder="0.0"
        />

        <p className="mt-3 text-sm text-slate-600">
          Expected base out: {formatAmount(redeem.expectedBaseOut)} / Min base out: {formatAmount(redeem.minBaseOut)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <TxButton
            label="Redeem"
            onClick={redeem.redeem}
            loading={redeem.redeemPending}
            disabled={!isConnected || redeem.sharesIn === 0n}
          />
          {redeem.paused && (
            <TxButton
              label="Emergency Redeem"
              onClick={redeem.emergencyRedeem}
              loading={redeem.emergencyPending}
              disabled={!isConnected || redeem.sharesIn === 0n}
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
    </section>
  );
}
