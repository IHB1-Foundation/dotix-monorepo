import { describe, expect, it } from "bun:test";

import { convertBaseValueToTokenAmount, convertSpotPriceToBaseValue } from "./strategy";

describe("strategy decimal handling", () => {
  it("converts non-18 token balances into base value using registry decimals", () => {
    const tokenDecimals = 6;
    const balance = 3_000_000n;
    const pricePerWholeTokenInBase = 2_500_000n;
    const spotPriceInBase = (pricePerWholeTokenInBase * 10n ** 18n) / 10n ** BigInt(tokenDecimals);

    expect(convertSpotPriceToBaseValue(balance, spotPriceInBase, tokenDecimals)).toBe(7_500_000n);
  });

  it("converts base value into non-18 token amounts using registry decimals", () => {
    const tokenDecimals = 6;
    const amountInBase = 7_500_000n;
    const pricePerWholeTokenInBase = 2_500_000n;
    const spotPriceInBase = (pricePerWholeTokenInBase * 10n ** 18n) / 10n ** BigInt(tokenDecimals);

    expect(convertBaseValueToTokenAmount(amountInBase, spotPriceInBase, tokenDecimals)).toBe(3_000_000n);
  });

  it("preserves value conversions for 18-decimal tokens", () => {
    const tokenDecimals = 18;
    const balance = 2n * 10n ** 18n;
    const pricePerWholeTokenInBase = 1_500_000n;
    const spotPriceInBase = (pricePerWholeTokenInBase * 10n ** 18n) / 10n ** BigInt(tokenDecimals);

    expect(convertSpotPriceToBaseValue(balance, spotPriceInBase, tokenDecimals)).toBe(3_000_000n);
    expect(convertBaseValueToTokenAmount(3_000_000n, spotPriceInBase, tokenDecimals)).toBe(balance);
  });
});
