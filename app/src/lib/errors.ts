export function mapContractError(error: unknown): string {
  const raw = typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error ?? "Unknown error");
  const text = raw.toLowerCase();

  if (text.includes("slippage") || text.includes("insufficient_output_amount")) {
    return "Price moved too much. Increase slippage tolerance.";
  }

  if (text.includes("cooldown")) {
    return "Rebalance cooldown active.";
  }

  if (text.includes("accesscontrol") || text.includes("unauthorized")) {
    return "You don't have permission for this action.";
  }

  if (text.includes("user rejected") || text.includes("rejected")) {
    return "Transaction was rejected in wallet.";
  }

  return raw.length > 180 ? `${raw.slice(0, 180)}...` : raw;
}
