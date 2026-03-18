"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { Card } from "@/components/Card";
import { useNAVHistory } from "@/hooks/useNAVHistory";

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      <p className="mb-1 text-slate-500 dark:text-slate-400">
        Block #{Number(label).toLocaleString("en-US")}
      </p>
      <p className="font-semibold">NAV: {Number(payload[0].value).toFixed(4)}</p>
    </div>
  );
}

const RANGES = ["24h", "7d", "30d", "all"] as const;
type Range = (typeof RANGES)[number];

export function NAVChart() {
  const [range, setRange] = useState<Range>("7d");
  const { points, loading } = useNAVHistory(range);

  const hasData = points.length > 0;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          NAV History
        </h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                range === r
                  ? "bg-ocean text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="h-40 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      )}

      {!loading && !hasData && (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No rebalance events found in this range.
          </p>
        </div>
      )}

      {!loading && hasData && (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="blockNumber"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `#${v.toLocaleString("en-US")}`}
              className="text-slate-500"
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => v.toFixed(2)}
              className="text-slate-500"
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="nav"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#navGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
