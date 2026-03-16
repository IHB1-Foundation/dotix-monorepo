import { describe, expect, it } from "bun:test";

import { computeSwapPlan, computeTargets, convertBaseValueToTokenAmount, convertSpotPriceToBaseValue } from "./strategy";
import type { AssetSnapshot, PoolSnapshot, VaultState } from "./types";

function makeAsset(partial: Partial<AssetSnapshot>): AssetSnapshot {
  return {
    address: "0x0000000000000000000000000000000000000001",
    symbol: "AST",
    decimals: 18,
    balance: 0n,
    currentWeightBps: 0,
    targetBps: 5000,
    maxSlippageBps: 300,
    maxTradeBps: 1000,
    ...partial,
  };
}

function makePool(partial: Partial<PoolSnapshot>): PoolSnapshot {
  return {
    token: "0x0000000000000000000000000000000000000001",
    reserveToken: 100_000n,
    reserveBase: 100_000n,
    spotPriceInBase: 10n ** 18n,
    ...partial,
  };
}

function makeState(partial: Partial<VaultState> = {}): VaultState {
  return {
    vault: "0x00000000000000000000000000000000000000aa",
    baseAsset: "0x00000000000000000000000000000000000000bb",
    baseAssetSymbol: "BASE",
    baseAssetDecimals: 6,
    nav: 1_000_000n,
    totalSupply: 1_000_000n,
    assets: [],
    pools: [],
    cooldownSeconds: 300,
    lastRebalanceAt: 0,
    maxNavTradeBps: 1000,
    paused: false,
    ...partial,
  };
}

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

  it("returns no swaps when NAV is zero", () => {
    const state = makeState({
      nav: 0n,
      assets: [makeAsset({ currentWeightBps: 8000 })],
      pools: [makePool({ token: "0x0000000000000000000000000000000000000001" })],
    });

    expect(computeSwapPlan(state, { "0x0000000000000000000000000000000000000001": 2000 })).toEqual([]);
  });

  it("reweights targets toward deeper pools under extreme imbalance", () => {
    const assets = [
      makeAsset({ address: "0x0000000000000000000000000000000000000001", targetBps: 5000 }),
      makeAsset({ address: "0x0000000000000000000000000000000000000002", targetBps: 5000 }),
    ];
    const pools = [
      makePool({ token: assets[0].address, reserveBase: 900_000n }),
      makePool({ token: assets[1].address, reserveBase: 100_000n }),
    ];
    const state = makeState({ assets, pools });

    expect(computeTargets(state)).toEqual({
      [assets[0].address]: 7000,
      [assets[1].address]: 3000,
    });
  });

  it("caps swap size with global trade limits and headroom", () => {
    const asset = makeAsset({
      address: "0x0000000000000000000000000000000000000001",
      currentWeightBps: 9000,
      targetBps: 1000,
      maxTradeBps: 700,
      maxSlippageBps: 200,
    });
    const state = makeState({
      nav: 1_000_000n,
      maxNavTradeBps: 500,
      assets: [asset],
      pools: [makePool({ token: asset.address })],
    });

    const [swap] = computeSwapPlan(state, { [asset.address]: 1000 });
    expect(swap.amountIn).toBe(49_500n);
    expect(swap.minAmountOut).toBe(48_510n);
  });

  it("computes minAmountOut correctly for base-to-token swaps with non-18 decimals", () => {
    const asset = makeAsset({
      address: "0x0000000000000000000000000000000000000001",
      decimals: 6,
      currentWeightBps: 1000,
      targetBps: 4000,
      maxSlippageBps: 300,
      maxTradeBps: 5000,
    });
    const pricePerWholeTokenInBase = 2_500_000n;
    const spotPriceInBase = (pricePerWholeTokenInBase * 10n ** 18n) / 10n ** BigInt(asset.decimals);
    const state = makeState({
      nav: 25_000_000n,
      maxNavTradeBps: 5000,
      assets: [asset],
      pools: [
        makePool({
          token: asset.address,
          spotPriceInBase,
          reserveBase: 500_000n,
        }),
      ],
    });

    const [swap] = computeSwapPlan(state, { [asset.address]: 4000 });
    expect(swap.tokenIn).toBe(state.baseAsset);
    expect(swap.amountIn).toBe(7_500_000n);
    expect(swap.minAmountOut).toBe(2_910_000n);
  });
});
