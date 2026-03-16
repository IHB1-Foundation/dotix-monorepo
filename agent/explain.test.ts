import { describe, expect, it } from "bun:test";

import { explainStrategy } from "./explain";
import type { StrategyOutput, VaultState } from "./types";

describe("explainStrategy", () => {
  it("formats large reserve ratios without Number precision loss", () => {
    const state: VaultState = {
      vault: "0x00000000000000000000000000000000000000aa",
      baseAsset: "0x00000000000000000000000000000000000000bb",
      baseAssetSymbol: "BASE",
      baseAssetDecimals: 18,
      nav: 1n,
      totalSupply: 1n,
      assets: [
        {
          address: "0x0000000000000000000000000000000000000001",
          symbol: "AAA",
          decimals: 18,
          balance: 0n,
          currentWeightBps: 5000,
          targetBps: 5000,
          maxSlippageBps: 300,
          maxTradeBps: 1000,
        },
        {
          address: "0x0000000000000000000000000000000000000002",
          symbol: "BBB",
          decimals: 18,
          balance: 0n,
          currentWeightBps: 5000,
          targetBps: 5000,
          maxSlippageBps: 300,
          maxTradeBps: 1000,
        },
      ],
      pools: [
        {
          token: "0x0000000000000000000000000000000000000001",
          reserveToken: 1n,
          reserveBase: 123456789012345678901234567890n,
          spotPriceInBase: 1n,
        },
        {
          token: "0x0000000000000000000000000000000000000002",
          reserveToken: 1n,
          reserveBase: 10000000000000000000000000000n,
          spotPriceInBase: 1n,
        },
      ],
      cooldownSeconds: 0,
      lastRebalanceAt: 0,
      maxNavTradeBps: 1000,
      paused: false,
    };

    const output: StrategyOutput = {
      newTargetBps: {
        "0x0000000000000000000000000000000000000001": 7000,
        "0x0000000000000000000000000000000000000002": 3000,
      },
      swaps: [],
      reasoning: {},
    };

    const [poolLine] = explainStrategy(state, output);
    expect(poolLine).toContain("12.34x reserveBase");
  });
});
