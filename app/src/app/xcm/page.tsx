"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
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

  return (
    <section className="space-y-4">
      <PageHeader title="XCM Demo" description="Weigh and execute XCM messages from the EVM surface." />

      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Precompile</h2>
        <p className="mt-1 text-sm text-slate-600">Precompile address: {xcm.precompileAddress}</p>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Message</h3>
        <div className="mb-3 flex gap-2 text-sm">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${mode === "default" ? "bg-ocean text-white" : "bg-slate-100"}`}
            onClick={() => setMode("default")}
          >
            Default Message
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${mode === "custom" ? "bg-ocean text-white" : "bg-slate-100"}`}
            onClick={() => setMode("custom")}
          >
            Custom
          </button>
        </div>

        {mode === "custom" && (
          <div>
            <input
              className="input"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="0x..."
            />
            {validationError && <p className="mt-2 text-sm text-red-600">{validationError}</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <TxButton
            label={mode === "default" ? "Weigh Default" : "Weigh Message"}
            variant="secondary"
            onClick={() => void (mode === "default" ? xcm.weighDefault() : xcm.weighMessage())}
            disabled={Boolean(validationError)}
          />
          <TxButton
            label="Execute Message"
            onClick={() => void xcm.executeMessage()}
            disabled={!xcm.result || !xcm.isKeeper || Boolean(validationError)}
            loading={xcm.txPending}
          />
        </div>

        {!xcm.isKeeper && <p className="mt-2 text-xs text-slate-500">Execute requires KEEPER_ROLE.</p>}
      </div>

      <XcmResult
        result={xcm.result}
        txHash={xcm.txHash}
        txPending={xcm.txPending}
        txConfirmed={xcm.txConfirmed}
        error={validationError ?? xcm.error}
      />

      <div className="card p-4 text-sm text-slate-700">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">What is XCM?</h3>
        <p>
          XCM (Cross-Consensus Messaging) enables communication across Polkadot consensus systems. This page demonstrates
          Solidity-native access to the XCM precompile on Polkadot Hub.
        </p>
      </div>
    </section>
  );
}
