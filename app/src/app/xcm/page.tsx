"use client";

import { useMemo, useState } from "react";

import { Accordion } from "@/components/Accordion";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { ToggleGroup } from "@/components/ToggleGroup";
import { TxButton } from "@/components/TxButton";
import { XcmResult } from "@/components/XcmResult";
import { useXcmDemo } from "@/hooks/useXcmDemo";

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

export default function XcmPage() {
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
    <section className="space-y-4">
      <div className="rounded-lg border border-info/30 bg-info-light/60 px-4 py-3 text-sm text-info-dark dark:border-info/40 dark:bg-info/10 dark:text-info-light">
        <strong>Advanced feature</strong> — This is an advanced feature for protocol administrators. Direct XCM interaction requires deep knowledge of cross-chain messaging.
      </div>
      <PageHeader title="Cross-Chain Messaging" description="Weigh and execute XCM messages from the EVM surface." />

      <Stepper
        steps={[
          {
            label: "Choose Message",
            detail: "Select default or enter custom hex payload.",
            completed: Boolean(mode),
            active: !weighDone,
          },
          {
            label: "Weigh",
            detail: "Estimate on-chain execution cost.",
            completed: weighDone,
            active: !weighDone,
          },
          {
            label: "Execute",
            detail: "Requires KEEPER_ROLE.",
            completed: executeDone,
            active: weighDone && !executeDone,
            locked: !xcm.isKeeper,
          },
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
            <input
              className="input"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="0x..."
            />
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
        {weighDone && <p className="mt-1 text-xs text-mint">✓ Weight calculated — proceed to execute</p>}

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
            {
              title: "What is XCM?",
              content: (
                <p>
                  XCM (Cross-Consensus Messaging) is Polkadot's standard format for passing messages and intent between
                  consensus systems.
                </p>
              ),
            },
            {
              title: "What does weigh do?",
              content: (
                <p>
                  `weigh` estimates execution cost (`refTime` and `proofSize`) before submission, so callers can set safe
                  execution limits.
                </p>
              ),
            },
            {
              title: "What does execute do?",
              content: (
                <p>
                  `execute` sends the XCM payload with computed limits to the precompile, which dispatches it to the
                  underlying runtime.
                </p>
              ),
            },
            {
              title: "Why is this special on Polkadot Hub?",
              content: (
                <p>
                  On Polkadot Hub, Solidity contracts can invoke XCM behavior directly through the precompile, bridging EVM
                  app UX and native interoperability.
                </p>
              ),
            },
          ]}
        />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Docs:{" "}
          <a href="https://wiki.polkadot.network/docs/learn-xcm" target="_blank" rel="noreferrer" className="underline">
            XCM Overview
          </a>
          {" · "}
          <a
            href="https://docs.polkadot.com/develop/interoperability/intro-to-xcm/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Polkadot Interoperability Guide
          </a>
        </p>
      </Card>
    </section>
  );
}
