"use client";

import { formatUnits } from "viem";

import { AgentSwap } from "@/hooks/useAgentPlan";
import { CopyableAddress } from "@/components/CopyableAddress";

export function SwapPlanTable({ swaps }: { swaps: AgentSwap[] }) {
  if (swaps.length === 0) {
    return <div className="card p-4 text-sm text-slate-600">No swaps proposed.</div>;
  }

  return (
    <div className="card -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="min-w-[42rem] text-left text-sm sm:min-w-full">
        <thead className="bg-slate-100 text-slate-700">
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
  );
}
