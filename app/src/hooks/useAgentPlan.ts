"use client";

import { useCallback, useEffect, useState } from "react";

export type AgentSwap = {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  path: string[];
  expectedSlippageBps: number;
};

export type AgentPlanPayload = {
  mode: string;
  timestamp: string;
  vaultState?: {
    assets?: Array<{ address: string; symbol: string; currentWeightBps: number }>;
  };
  newTargets: Record<string, number>;
  swaps: AgentSwap[];
  explanation: string[];
};

/**
 * Normalize raw agent output (which uses `output.newTargetBps`, `output.swaps`,
 * `output.reasoning`) into the flat shape the UI expects.
 */
function normalize(raw: Record<string, unknown> | undefined | null): AgentPlanPayload {
  if (!raw || typeof raw !== "object") {
    return { mode: "unknown", timestamp: new Date().toISOString(), newTargets: {}, swaps: [], explanation: [] };
  }

  // Already normalized format
  if (raw.newTargets && Array.isArray(raw.swaps)) {
    return {
      ...(raw as unknown as AgentPlanPayload),
      timestamp: String(raw.timestamp ?? new Date().toISOString()),
      explanation: Array.isArray(raw.explanation) ? raw.explanation : [],
    };
  }

  // Agent dry-run / execute format: { state, output: { newTargetBps, swaps, reasoning } }
  const output = (raw.output ?? {}) as Record<string, unknown>;
  const reasoning = (output.reasoning ?? {}) as Record<string, string>;

  return {
    mode: String(raw.mode ?? "unknown"),
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
    vaultState: raw.state as AgentPlanPayload["vaultState"],
    newTargets: (output.newTargetBps ?? output.newTargets ?? {}) as Record<string, number>,
    swaps: (Array.isArray(output.swaps) ? output.swaps : []) as AgentSwap[],
    explanation: Array.isArray(raw.explanation)
      ? raw.explanation
      : Object.values(reasoning),
  };
}

export function useAgentPlan() {
  const [plan, setPlan] = useState<AgentPlanPayload | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent-plan", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load plan: ${res.status}`);
      }

      const json = (await res.json()) as { file: string; payload: Record<string, unknown> };
      setFile(json.file);
      setPlan(normalize(json.payload));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    plan,
    file,
    loading,
    error,
    loadPlan,
  };
}
