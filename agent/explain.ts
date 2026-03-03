import { StrategyOutput, VaultState } from "./types";

function formatWei(amount: bigint, decimals = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, 4);
  return `${whole.toString()}.${fractionText}`;
}

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function explainStrategy(state: VaultState, output: StrategyOutput): string[] {
  const lines: string[] = [];

  if (state.paused) {
    lines.push("Vault is paused. Rebalancing disabled.");
  }

  const now = Math.floor(Date.now() / 1000);
  const nextRebalanceAt = state.lastRebalanceAt + state.cooldownSeconds;
  if (state.lastRebalanceAt > 0 && nextRebalanceAt > now) {
    lines.push(`Cooldown active — next rebalance available in ${nextRebalanceAt - now} seconds.`);
  }

  const sortedPools = [...state.pools].sort((a, b) => (a.reserveBase > b.reserveBase ? -1 : 1));
  if (sortedPools.length >= 2) {
    const top = sortedPools[0];
    const second = sortedPools[1];
    const multiplier = second.reserveBase === 0n ? 0 : Number((top.reserveBase * 100n) / second.reserveBase) / 100;
    const topTarget = output.newTargetBps[top.token] ?? 0;
    const secondTarget = output.newTargetBps[second.token] ?? 0;
    lines.push(
      `Pool depth comparison: top asset has ${multiplier.toFixed(2)}x reserveBase vs second; targets now ${formatBps(topTarget)} and ${formatBps(secondTarget)}.`
    );
  }

  if (output.swaps.length === 0) {
    lines.push("Portfolio already within target range. No swaps needed.");
    return lines;
  }

  for (const swap of output.swaps) {
    const fromAsset = state.assets.find((asset) => asset.address.toLowerCase() === swap.tokenIn.toLowerCase());
    const toAsset = state.assets.find((asset) => asset.address.toLowerCase() === swap.tokenOut.toLowerCase());

    const fromSymbol = fromAsset?.symbol ?? (swap.tokenIn.toLowerCase() === state.baseAsset.toLowerCase() ? "BASE" : "UNKNOWN");
    const toSymbol = toAsset?.symbol ?? (swap.tokenOut.toLowerCase() === state.baseAsset.toLowerCase() ? "BASE" : "UNKNOWN");
    const maxSlip = fromAsset?.maxSlippageBps ?? swap.expectedSlippageBps;

    lines.push(
      `Expected swap: ${formatWei(swap.amountIn)} ${fromSymbol} -> at least ${formatWei(swap.minAmountOut)} ${toSymbol} (${formatBps(swap.expectedSlippageBps)} expected, ${formatBps(maxSlip)} max).`
    );
  }

  lines.push(
    `Trade size capped at ${formatBps(state.maxNavTradeBps)} NAV per guardrail (maxNavTradeBps = ${state.maxNavTradeBps}).`
  );

  if (state.cooldownSeconds > 0) {
    lines.push(`Configured cooldown window: ${formatSeconds(state.cooldownSeconds)}.`);
  }

  return lines;
}
