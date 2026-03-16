import { StrategyOutput, VaultState } from "./types";

function formatAmount(amount: bigint, decimals: number): string {
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

function formatRatio(numerator: bigint, denominator: bigint, decimals = 2): string {
  if (denominator === 0n) {
    return `0.${"0".repeat(decimals)}`;
  }

  const scale = 10n ** BigInt(decimals);
  const scaled = (numerator * scale) / denominator;
  const whole = scaled / scale;
  const fraction = (scaled % scale).toString().padStart(decimals, "0");
  return `${whole.toString()}.${fraction}`;
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
    const topTarget = output.newTargetBps[top.token] ?? 0;
    const secondTarget = output.newTargetBps[second.token] ?? 0;
    lines.push(
      `Pool depth comparison: top asset has ${formatRatio(top.reserveBase, second.reserveBase)}x reserveBase vs second; targets now ${formatBps(topTarget)} and ${formatBps(secondTarget)}.`
    );
  }

  if (output.swaps.length === 0) {
    lines.push("Portfolio already within target range. No swaps needed.");
    return lines;
  }

  for (const swap of output.swaps) {
    const fromAsset = state.assets.find((asset) => asset.address.toLowerCase() === swap.tokenIn.toLowerCase());
    const toAsset = state.assets.find((asset) => asset.address.toLowerCase() === swap.tokenOut.toLowerCase());

    const fromIsBase = swap.tokenIn.toLowerCase() === state.baseAsset.toLowerCase();
    const toIsBase = swap.tokenOut.toLowerCase() === state.baseAsset.toLowerCase();
    const fromSymbol = fromAsset?.symbol ?? (fromIsBase ? state.baseAssetSymbol : "UNKNOWN");
    const toSymbol = toAsset?.symbol ?? (toIsBase ? state.baseAssetSymbol : "UNKNOWN");
    const fromDecimals = fromAsset?.decimals ?? (fromIsBase ? state.baseAssetDecimals : 18);
    const toDecimals = toAsset?.decimals ?? (toIsBase ? state.baseAssetDecimals : 18);
    const maxSlip = fromAsset?.maxSlippageBps ?? swap.expectedSlippageBps;

    lines.push(
      `Expected swap: ${formatAmount(swap.amountIn, fromDecimals)} ${fromSymbol} -> at least ${formatAmount(swap.minAmountOut, toDecimals)} ${toSymbol} (${formatBps(swap.expectedSlippageBps)} expected, ${formatBps(maxSlip)} max).`
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
