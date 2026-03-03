"use client";

import { useEffect, useMemo, useState } from "react";

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

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Rebalance Status</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${paused ? "bg-red-100 text-red-700" : "bg-mint/20 text-mint"}`}>
          {paused ? "paused" : "active"}
        </span>
      </div>
      <p className="text-sm text-slate-700">Cooldown remaining: {formatCountdown(cooldownRemaining)}</p>
      <p className="text-xs text-slate-500">
        Last rebalance: {lastRebalanceAt > 0 ? new Date(lastRebalanceAt * 1000).toLocaleString() : "never"}
      </p>
    </div>
  );
}
