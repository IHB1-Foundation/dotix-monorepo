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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
        <div className="h-[180px] w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 md:h-[240px]" />
      )}

      {!loading && !hasData && (
        <div className="relative flex h-[180px] items-center justify-center md:h-[240px]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeDasharray="6 4" className="text-slate-200 dark:text-slate-700" />
          </svg>
          <p className="relative text-sm text-slate-400 dark:text-slate-500">No data for this range</p>
        </div>
      )}

      {!loading && hasData && (
        <div className="h-[180px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
        </div>
      )}
    </Card>
  );
}
