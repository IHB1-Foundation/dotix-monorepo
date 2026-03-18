"use client";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { useActivityLog } from "@/hooks/useActivityLog";
import { explorerTxUrl } from "@/lib/network";

const typeConfig = {
  Deposit: {
    label: "Deposit",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v12" /><path d="m7 11 5 5 5-5" />
      </svg>
    ),
    color: "text-mint bg-mint/8",
  },
  Redeem: {
    label: "Redeem",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20V8" /><path d="m17 13-5-5-5 5" />
      </svg>
    ),
    color: "text-warning bg-warning/8",
  },
  Rebalanced: {
    label: "Rebalance",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
    color: "text-ocean bg-ocean/8",
  },
};

export function ActivityFeed() {
  const { entries, loading, error } = useActivityLog(10);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Recent Activity
        </h3>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 py-1">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Activity unavailable: {error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
            </svg>
          }
          title="No recent activity"
          description="Vault events will appear here."
        />
      )}

      {!loading && entries.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {entries.map((entry) => {
            const cfg = typeConfig[entry.type];
            return (
              <li key={`${entry.txHash}-${entry.type}`} className="flex items-center gap-3 py-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                  {cfg.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{entry.label}</p>
                  {entry.user && (
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      {entry.user.slice(0, 6)}…{entry.user.slice(-4)}
                    </p>
                  )}
                </div>
                {entry.amount && (
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {entry.amount}
                  </span>
                )}
                <a
                  href={explorerTxUrl(entry.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on Explorer"
                  className="shrink-0 text-slate-400 transition hover:text-ocean dark:text-slate-500 dark:hover:text-ocean-light"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
