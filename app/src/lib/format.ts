import { formatUnits } from "viem";

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/**
 * Format a bigint token amount with 4 decimal places.
 * Returns "—" for zero or invalid values.
 */
export function formatToken(value: bigint, decimals = 18, symbol?: string): string {
  const parsed = Number(formatUnits(value, decimals));
  if (!Number.isFinite(parsed) || parsed === 0) return "—";
  const formatted = decimalFormatter.format(parsed);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format a token amount from a string (for display in inputs/previews).
 */
export function formatTokenStr(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(4);
}

/**
 * Format basis points as a percentage string, e.g. 150 bps → "1.50%"
 */
export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Format a large number with K/M/B suffix for compact display.
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(4);
}

/**
 * Re-export the shared decimal formatter for components that need raw Intl formatting.
 */
export { decimalFormatter };
