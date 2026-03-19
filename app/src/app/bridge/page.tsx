"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useSearchParams } from "next/navigation";

import { Accordion } from "@/components/Accordion";
import { Card } from "@/components/Card";
import { ConnectCTA } from "@/components/ConnectCTA";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { ToggleGroup } from "@/components/ToggleGroup";
import { TxButton } from "@/components/TxButton";
import { XcmResult } from "@/components/XcmResult";
import { useBridge } from "@/hooks/useBridge";
import { useXcmDemo } from "@/hooks/useXcmDemo";
import { explorerTxUrl } from "@/lib/network";
import { formatTokenStr } from "@/lib/format";
import { PARACHAIN_DESTINATIONS, type ParachainDestination } from "@/lib/xcm-templates";
import { useAccount } from "wagmi";

const formatAmount = formatTokenStr;

/* ──────── Custom XCM helpers (from original xcm page) ──────── */

function normalizeHex(input: string): `0x${string}` {
  const withPrefix = input.startsWith("0x") ? input : `0x${input}`;
  return withPrefix as `0x${string}`;
}

function validateHex(value: string): string | null {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (normalized.length === 0) return "Message cannot be empty.";
  if (normalized.length % 2 !== 0) return "Hex must have even length.";
  if (!/^[0-9a-fA-F]+$/.test(normalized)) return "Invalid hex characters.";
  return null;
}

function sanitizeAmountInput(value: string): string {
  const normalized = value.replace(/,/g, ".");
  let next = "";
  let hasDot = false;
  for (const char of normalized) {
    if (/\d/.test(char)) { next += char; continue; }
    if (char === "." && !hasDot) { hasDot = true; next += char; }
  }
  return next;
}

/* ──────── Custom XCM Tab (preserved original) ──────── */

function CustomXcmTab() {
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [customHex, setCustomHex] = useState("0x03020100");

  const effectiveHex = useMemo(() => {
    return mode === "default" ? ("0x03020100" as `0x${string}`) : normalizeHex(customHex);
  }, [customHex, mode]);

  const validationError = mode === "custom" ? validateHex(customHex) : null;
  const xcm = useXcmDemo(effectiveHex);

  const weighDone = Boolean(xcm.result);
  const executeDone = xcm.txConfirmed;

  return (
    <div className="space-y-4">
      <Stepper
        steps={[
          { label: "Choose Message", detail: "Select default or enter custom hex payload.", completed: Boolean(mode), active: !weighDone },
          { label: "Weigh", detail: "Estimate on-chain execution cost.", completed: weighDone, active: !weighDone },
          { label: "Execute", detail: "Requires KEEPER_ROLE.", completed: executeDone, active: weighDone && !executeDone, locked: !xcm.isKeeper },
        ]}
      />

      <Card padding="spacious">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Precompile</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Precompile address: {xcm.precompileAddress}</p>
      </Card>

      <Card padding="spacious">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Step 1 — Choose Message</h3>
        <ToggleGroup
          items={[
            { value: "default", label: "Default Message" },
            { value: "custom", label: "Custom" },
          ]}
          value={mode}
          onChange={setMode}
          className="mb-3"
        />

        {mode === "default" && (
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">0x03020100</code>{" "}
            — XCM ClearOrigin instruction (safe no-op for demo, costs minimal gas)
          </p>
        )}

        {mode === "custom" && (
          <div>
            <input className="input" value={customHex} onChange={(e) => setCustomHex(e.target.value)} placeholder="0x..." />
            {validationError && <p className="mt-2 text-sm text-error">{validationError}</p>}
          </div>
        )}

        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Step 2 — Weigh</h3>
        <div className="flex flex-wrap gap-2">
          <TxButton
            label={mode === "default" ? "Weigh Default" : "Weigh Message"}
            variant="secondary"
            onClick={() => void (mode === "default" ? xcm.weighDefault() : xcm.weighMessage())}
            disabled={Boolean(validationError)}
          />
        </div>
        {weighDone && <p className="mt-1 text-xs text-mint">Weight calculated — proceed to execute</p>}

        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Step 3 — Execute</h3>
        <div className="flex flex-wrap gap-2">
          <TxButton
            label="Execute Message"
            onClick={() => void xcm.executeMessage()}
            disabled={!xcm.result || !xcm.isKeeper || Boolean(validationError)}
            loading={xcm.txPending}
          />
        </div>
        {!xcm.isKeeper && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Execute requires KEEPER_ROLE.</p>}
        {!xcm.result && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Weigh first to enable execute.</p>}
      </Card>

      <XcmResult
        result={xcm.result}
        txHash={xcm.txHash}
        txPending={xcm.txPending}
        txConfirmed={xcm.txConfirmed}
        error={validationError ?? xcm.error}
      />

      <Card className="text-sm text-slate-700 dark:text-slate-200">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">XCM FAQ</h3>
        <Accordion
          items={[
            { title: "What is XCM?", content: <p>XCM (Cross-Consensus Messaging) is Polkadot&apos;s standard format for passing messages and intent between consensus systems.</p> },
            { title: "What does weigh do?", content: <p>`weigh` estimates execution cost (`refTime` and `proofSize`) before submission, so callers can set safe execution limits.</p> },
            { title: "What does execute do?", content: <p>`execute` sends the XCM payload with computed limits to the precompile, which dispatches it to the underlying runtime.</p> },
            { title: "Why is this special on Polkadot Hub?", content: <p>On Polkadot Hub, Solidity contracts can invoke XCM behavior directly through the precompile, bridging EVM app UX and native interoperability.</p> },
          ]}
        />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Docs:{" "}
          <a href="https://wiki.polkadot.network/docs/learn-xcm" target="_blank" rel="noreferrer" className="underline">XCM Overview</a>
          {" · "}
          <a href="https://docs.polkadot.com/develop/interoperability/intro-to-xcm/" target="_blank" rel="noreferrer" className="underline">Polkadot Interoperability Guide</a>
        </p>
      </Card>
    </div>
  );
}

/* ──────── Bridge Tab ──────── */

function DestinationCard({
  dest,
  selected,
  onSelect,
}: {
  dest: ParachainDestination;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-ocean bg-ocean/5 ring-2 ring-ocean/30 dark:border-ocean-light dark:bg-ocean/10"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean/10 text-sm font-bold text-ocean dark:bg-ocean/20 dark:text-ocean-light">
          {dest.icon}
        </span>
        <span className="font-semibold text-ink dark:text-slate-100">{dest.name}</span>
        <span className="text-xs text-slate-400">#{dest.paraId}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{dest.description}</p>
    </button>
  );
}

function BridgeTab() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const initialAmount = searchParams?.get("amount") ?? "";
  const [selectedDest, setSelectedDest] = useState<ParachainDestination | null>(null);
  const [amountInput, setAmountInput] = useState(initialAmount);

  const bridge = useBridge(selectedDest);

  const stepperSteps = [
    { label: "Select Destination", detail: "Choose a parachain to bridge to.", completed: Boolean(selectedDest), active: !selectedDest },
    { label: "Enter Amount", detail: "Specify USDC amount to bridge.", completed: Boolean(selectedDest && amountInput), active: Boolean(selectedDest) && !amountInput },
    { label: "Estimate Cost", detail: "Weigh the XCM message.", completed: bridge.step === "weighed" || bridge.step === "done", active: Boolean(amountInput) && bridge.step === "idle" },
    { label: "Bridge", detail: "Execute cross-chain transfer.", completed: bridge.step === "done", active: bridge.step === "weighed", locked: !bridge.isKeeper },
  ];

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <ConnectCTA variant="inline" description="Connect your wallet to bridge assets to other parachains." />
      </div>
    );
  }

  // Success state
  if (bridge.step === "done" && bridge.txHash) {
    return (
      <Card padding="spacious">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint/10">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-mint" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path className="check-animate" d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink dark:text-slate-100">Bridge successful!</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            XCM message sent to {selectedDest?.name ?? "parachain"} (#{selectedDest?.paraId})
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={explorerTxUrl(bridge.txHash)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View on Explorer
            </a>
            <button
              type="button"
              onClick={() => {
                bridge.reset();
                setSelectedDest(null);
                setAmountInput("");
              }}
              className="rounded-xl bg-ocean px-4 py-2 text-sm font-bold text-white transition hover:bg-ocean-dark"
            >
              Bridge Again
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl bg-ocean/10 px-4 py-2 text-sm font-bold text-ocean transition hover:bg-ocean/20 dark:text-ocean-light"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Stepper steps={stepperSteps} />

      {/* Step 1: Select Destination */}
      <Card padding="spacious">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Select Destination
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PARACHAIN_DESTINATIONS.map((dest) => (
            <DestinationCard
              key={dest.id}
              dest={dest}
              selected={selectedDest?.id === dest.id}
              onSelect={() => setSelectedDest(dest)}
            />
          ))}
        </div>
      </Card>

      {/* Step 2: Enter Amount */}
      {selectedDest && (
        <Card padding="spacious">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Enter Amount
          </h3>
          <div className="rounded-2xl bg-slate-50 p-4 focus-within:ring-2 focus-within:ring-ocean/30 dark:bg-slate-950">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</span>
              <button
                type="button"
                onClick={() => setAmountInput(bridge.usdcBalance > 0n ? formatUnits(bridge.usdcBalance, bridge.decimals).replace(/\.?0+$/, "") : "0")}
                className="text-xs font-semibold text-ocean hover:text-ocean-dark dark:text-ocean-light"
              >
                Available: {formatAmount(bridge.usdcBalance, bridge.decimals)} {bridge.symbol}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="min-w-0 flex-1 bg-transparent text-2xl font-bold tabular-nums text-ink placeholder:text-slate-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-600"
                value={amountInput}
                onChange={(e) => setAmountInput(sanitizeAmountInput(e.target.value))}
                placeholder="0"
                inputMode="decimal"
                style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}
              />
              <span className="shrink-0 text-sm font-semibold text-slate-500">{bridge.symbol}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3 & 4: Weigh + Execute */}
      {selectedDest && amountInput && (
        <Card padding="spacious">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Estimate & Bridge
          </h3>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TxButton
              label="Estimate Cost"
              variant="secondary"
              onClick={() => void bridge.weigh()}
              disabled={bridge.step !== "idle"}
            />
            <TxButton
              label={`Bridge to ${selectedDest.name}`}
              onClick={() => void bridge.execute()}
              disabled={bridge.step !== "weighed" || !bridge.isKeeper}
              loading={bridge.txPending}
            />
          </div>

          {bridge.step === "weighed" && bridge.weighResult && (
            <p className="mt-2 text-xs text-mint">
              Cost estimated (refTime: {bridge.weighResult.refTime.toString()}, proofSize: {bridge.weighResult.proofSize.toString()}) — ready to bridge
            </p>
          )}

          {!bridge.isKeeper && (
            <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning-dark dark:border-warning/40 dark:bg-warning/10 dark:text-warning-light">
              Bridge execution requires KEEPER_ROLE. Contact the protocol admin to grant access.
            </div>
          )}

          {bridge.error && <p className="mt-2 text-sm text-error">{bridge.error}</p>}
        </Card>
      )}
    </div>
  );
}

/* ──────── Main Page ──────── */

export default function BridgePage() {
  const [tab, setTab] = useState<"bridge" | "custom">("bridge");

  return (
    <section className="space-y-4">
      <PageHeader title="Bridge" description="Bridge withdrawn assets to other parachains via XCM." />

      <ToggleGroup
        items={[
          { value: "bridge", label: "Bridge" },
          { value: "custom", label: "Custom XCM" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "bridge" && <BridgeTab />}
      {tab === "custom" && (
        <>
          <div className="rounded-lg border border-info/30 bg-info-light/60 px-4 py-3 text-sm text-info-dark dark:border-info/40 dark:bg-info/10 dark:text-info-light">
            <strong>Advanced feature</strong> — Direct XCM interaction requires deep knowledge of cross-chain messaging.
          </div>
          <CustomXcmTab />
        </>
      )}
    </section>
  );
}
