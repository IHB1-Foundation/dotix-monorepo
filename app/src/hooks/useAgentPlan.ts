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

export function useAgentPlan() {
  const [plan, setPlan] = useState<AgentPlanPayload | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent-plan", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load plan: ${res.status}`);
      }

      const json = (await res.json()) as { file: string; payload: AgentPlanPayload };
      setFile(json.file);
      setPlan(json.payload);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  return {
    plan,
    file,
    loading,
    error,
    loadPlan,
  };
}
