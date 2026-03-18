"use client";

import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@/components/Tooltip";

type Props = {
  cooldownSeconds: number;
  lastRebalanceAt: number;
  paused: boolean;
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function RebalanceStatus({ cooldownSeconds, lastRebalanceAt, paused }: Props) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const cooldownRemaining = useMemo(() => {
    const next = lastRebalanceAt + cooldownSeconds;
    return Math.max(next - now, 0);
  }, [cooldownSeconds, lastRebalanceAt, now]);

  const progressPercent = useMemo(() => {
    if (cooldownSeconds <= 0) return 100;
    return clamp(((cooldownSeconds - cooldownRemaining) / cooldownSeconds) * 100);
  }, [cooldownRemaining, cooldownSeconds]);

  const isReady = !paused && cooldownRemaining === 0;

  return (
    <div className={`card p-4 ${paused ? "border-error/30 bg-error-light/40 dark:border-error/40 dark:bg-error/10" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          <Tooltip content="Cooldown: minimum waiting time between rebalance executions to prevent over-trading.">Rebalance Status</Tooltip>
        </h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${paused ? "bg-error-light text-error-dark" : "bg-mint/20 text-mint"}`}>
          {paused ? "paused" : "active"}
        </span>
      </div>

      <div className="mb-3 space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-ocean transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-200">Cooldown remaining: {formatCountdown(cooldownRemaining)}</p>
      </div>

      {isReady ? (
        <p className="mb-2 inline-flex items-center rounded-full bg-mint/15 px-2 py-1 text-xs font-semibold text-mint animate-pulse">
          Ready to rebalance
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Last rebalance: {lastRebalanceAt > 0 ? new Date(lastRebalanceAt * 1000).toLocaleString("en-US") : "never"}
      </p>
    </div>
  );
}
