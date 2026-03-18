"use client";

import { formatUnits } from "viem";

import { Card } from "@/components/Card";
import { AgentSwap } from "@/hooks/useAgentPlan";
import { CopyableAddress } from "@/components/CopyableAddress";

export function SwapPlanTable({ swaps }: { swaps: AgentSwap[] }) {
  if (swaps.length === 0) {
    return (
      <Card padding="spacious" className="text-center">
        <svg viewBox="0 0 64 64" className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 32h32M40 24l8 8-8 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 20V16a4 4 0 0 0-4-4H20a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-4" strokeLinecap="round" />
        </svg>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">No swaps proposed</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Generate a plan to see swap proposals.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-2 sm:hidden">
        {swaps.map((swap, idx) => (
          <article key={`${swap.tokenIn}-${swap.tokenOut}-mobile-${idx}`} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Swap {idx + 1}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Route</span>
                <span className="flex items-center gap-1">
                  <CopyableAddress address={swap.tokenIn} />
                  <span>-&gt;</span>
                  <CopyableAddress address={swap.tokenOut} />
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Amount In</span>
                <span>{Number(formatUnits(BigInt(swap.amountIn), 18)).toFixed(4)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Min Out</span>
                <span>{Number(formatUnits(BigInt(swap.minAmountOut), 18)).toFixed(4)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Slippage</span>
                <span>{(swap.expectedSlippageBps / 100).toFixed(2)}%</span>
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="relative -mx-4 hidden overflow-x-auto px-4 sm:mx-0 sm:block sm:px-0">
        <table className="min-w-[42rem] text-left text-sm sm:min-w-full">
          <thead className="sticky top-0 bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">tokenIn</th>
              <th className="px-3 py-2">tokenOut</th>
              <th className="px-3 py-2">amountIn</th>
              <th className="px-3 py-2">minOut</th>
              <th className="px-3 py-2">slippage</th>
            </tr>
          </thead>
          <tbody>
            {swaps.map((swap, idx) => (
              <tr key={`${swap.tokenIn}-${swap.tokenOut}-${idx}`} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  <CopyableAddress address={swap.tokenIn} />
                </td>
                <td className="px-3 py-2">
                  <CopyableAddress address={swap.tokenOut} />
                </td>
                <td className="px-3 py-2">{Number(formatUnits(BigInt(swap.amountIn), 18)).toFixed(4)}</td>
                <td className="px-3 py-2">{Number(formatUnits(BigInt(swap.minAmountOut), 18)).toFixed(4)}</td>
                <td className="px-3 py-2">{(swap.expectedSlippageBps / 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
