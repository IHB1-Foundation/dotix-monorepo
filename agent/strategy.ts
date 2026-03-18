import fs from "node:fs";
import path from "node:path";

import { Contract, JsonRpcProvider } from "ethers";

import vaultArtifact from "../shared/abi/IndexVault.json";
import registryArtifact from "../shared/abi/TokenRegistry.json";
import routerArtifact from "../shared/abi/UniswapV2Router02.json";
import pairArtifact from "../shared/abi/UniswapV2Pair.json";
import erc20Artifact from "../shared/abi/MockERC20.json";
import deployments from "../deployments/testnet.json";
import { getRpcUrl } from "../shared/config";

import { MAX_TARGET_BPS, MIN_TARGET_BPS, TRADE_CAP_HEADROOM_BPS } from "./config";
import { AssetSnapshot, PoolSnapshot, StrategyOutput, SwapPlan, VaultState } from "./types";

const PRICE_SCALE = 10n ** 18n;

function bigintMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

function decimalsScale(decimals: number): bigint {
  return 10n ** BigInt(decimals);
}

export function convertSpotPriceToBaseValue(
  balance: bigint,
  spotPriceInBase: bigint,
  tokenDecimals: number
): bigint {
  const tokenScale = decimalsScale(tokenDecimals);
  const pricePerWholeTokenInBase = (spotPriceInBase * tokenScale) / PRICE_SCALE;
  return (balance * pricePerWholeTokenInBase) / tokenScale;
}

export function convertBaseValueToTokenAmount(
  amountInBase: bigint,
  spotPriceInBase: bigint,
  tokenDecimals: number
): bigint {
  const tokenScale = decimalsScale(tokenDecimals);
  const pricePerWholeTokenInBase = (spotPriceInBase * tokenScale) / PRICE_SCALE;

  if (pricePerWholeTokenInBase === 0n) {
    return 0n;
  }

  return (amountInBase * tokenScale) / pricePerWholeTokenInBase;
}

async function readBaseAssetMeta(baseAsset: string, provider: JsonRpcProvider): Promise<{ symbol: string; decimals: number }> {
  const baseToken = new Contract(baseAsset, erc20Artifact.abi, provider);
  const [symbolResult, decimalsResult] = await Promise.allSettled([baseToken.symbol(), baseToken.decimals()]);

  return {
    symbol: symbolResult.status === "fulfilled" ? String(symbolResult.value) : "BASE",
    decimals: decimalsResult.status === "fulfilled" ? Number(decimalsResult.value) : 18,
  };
}

async function readAssetSnapshot(
  vault: Contract,
  registry: Contract,
  tokenAddress: string,
  targetBps: number,
  maxSlippageBps: number,
  maxTradeBps: number,
  nav: bigint,
  baseAsset: string,
  router: Contract,
  factoryAddress: string
): Promise<{ asset: AssetSnapshot; pool: PoolSnapshot }> {
  const token = new Contract(tokenAddress, erc20Artifact.abi, vault.runner);
  const pairFactory = new Contract(factoryAddress, [{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"stateMutability":"view","type":"function"}], vault.runner);

  const [meta, balance, spotPriceInBase, pairAddress] = await Promise.all([
    registry.getTokenMeta(tokenAddress),
    token.balanceOf(await vault.getAddress()),
    vault.getSpotPrice(tokenAddress),
    pairFactory.getPair(baseAsset, tokenAddress),
  ]);

  const tokenDecimals = Number(meta.decimals);

  let reserveToken = 0n;
  let reserveBase = 0n;

  if (pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000") {
    const pair = new Contract(pairAddress, pairArtifact.abi, vault.runner);
    const [token0, reserves] = await Promise.all([pair.token0(), pair.getReserves()]);

    if (String(token0).toLowerCase() === baseAsset.toLowerCase()) {
      reserveBase = reserves[0] as bigint;
      reserveToken = reserves[1] as bigint;
    } else {
      reserveBase = reserves[1] as bigint;
      reserveToken = reserves[0] as bigint;
    }
  }

  const valueInBase = convertSpotPriceToBaseValue(balance as bigint, spotPriceInBase as bigint, tokenDecimals);
  const currentWeightBps = nav > 0n ? Number((valueInBase * 10_000n) / nav) : 0;

  const asset: AssetSnapshot = {
    address: tokenAddress,
    symbol: meta.symbol,
    decimals: tokenDecimals,
    balance: balance as bigint,
    currentWeightBps,
    targetBps,
    maxSlippageBps,
    maxTradeBps,
  };

  const pool: PoolSnapshot = {
    token: tokenAddress,
    reserveToken,
    reserveBase,
    spotPriceInBase: spotPriceInBase as bigint,
  };

  void router;
  return { asset, pool };
}

export async function readVaultState(vaultAddress: string, provider: JsonRpcProvider): Promise<VaultState> {
  const vault = new Contract(vaultAddress, vaultArtifact.abi, provider);
  const [baseAsset, nav, cooldownSeconds, lastRebalanceAt, maxNavTradeBps, paused, routerAddress, registryAddress, pdotAddress] =
    await Promise.all([
      vault.baseAsset(),
      vault.calcNAV(),
      vault.cooldownSeconds(),
      vault.lastRebalanceAt(),
      vault.maxNavTradeBps(),
      vault.paused(),
      vault.uniswapRouter(),
      vault.registry(),
      vault.pdot(),
    ]);

  const router = new Contract(routerAddress, routerArtifact.abi, provider);
  const registry = new Contract(registryAddress, registryArtifact.abi, provider);
  const pdot = new Contract(pdotAddress, [{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}], provider);
  const baseMeta = await readBaseAssetMeta(baseAsset, provider);

  const [assetsLength, totalSupply, factoryAddress] = await Promise.all([
    vault.assetsLength(),
    pdot.totalSupply(),
    router.factory(),
  ]);

  const assets: AssetSnapshot[] = [];
  const pools: PoolSnapshot[] = [];

  for (let i = 0; i < Number(assetsLength); i++) {
    const config = await vault.assets(i);
    if (!config.enabled) continue;

    const snapshot = await readAssetSnapshot(
      vault,
      registry,
      config.token,
      toNumber(config.targetBps),
      toNumber(config.maxSlippageBps),
      toNumber(config.maxTradeBps),
      nav as bigint,
      baseAsset,
      router,
      factoryAddress
    );

    assets.push(snapshot.asset);
    pools.push(snapshot.pool);
  }

  return {
    vault: vaultAddress,
    baseAsset,
    baseAssetSymbol: baseMeta.symbol,
    baseAssetDecimals: baseMeta.decimals,
    nav: nav as bigint,
    totalSupply: totalSupply as bigint,
    assets,
    pools,
    cooldownSeconds: toNumber(cooldownSeconds),
    lastRebalanceAt: toNumber(lastRebalanceAt),
    maxNavTradeBps: toNumber(maxNavTradeBps),
    paused: Boolean(paused),
  };
}

export function computeTargets(state: VaultState): Record<string, number> {
  const fallbackTargets: Record<string, number> = {};

  if (state.assets.length === 0) {
    return fallbackTargets;
  }

  for (const asset of state.assets) {
    fallbackTargets[asset.address] = asset.targetBps;
  }

  if (state.totalSupply === 0n) {
    return fallbackTargets;
  }

  const scores = state.pools.map((pool) => pool.reserveBase);
  const totalScore = scores.reduce((acc, cur) => acc + cur, 0n);
  if (totalScore === 0n) {
    return fallbackTargets;
  }

  const clipped: number[] = [];
  for (const score of scores) {
    const raw = Number((score * 10_000n) / totalScore);
    clipped.push(Math.min(MAX_TARGET_BPS, Math.max(MIN_TARGET_BPS, raw)));
  }

  const sum = clipped.reduce((acc, cur) => acc + cur, 0);
  const adjusted = [...clipped];
  adjusted[adjusted.length - 1] += 10_000 - sum;

  const out: Record<string, number> = {};
  state.assets.forEach((asset, index) => {
    out[asset.address] = adjusted[index];
  });

  return out;
}

export function computeSwapPlan(state: VaultState, newTargets: Record<string, number>): SwapPlan[] {
  const swaps: SwapPlan[] = [];

  if (state.totalSupply === 0n || state.nav === 0n || state.assets.length === 0) {
    return swaps;
  }

  for (const asset of state.assets) {
    const newTarget = newTargets[asset.address] ?? asset.targetBps;
    const delta = asset.currentWeightBps - newTarget;
    if (delta === 0) continue;

    const desiredTrade = (BigInt(Math.abs(delta)) * state.nav) / 10_000n;
    const capBps = Math.min(asset.maxTradeBps, state.maxNavTradeBps);
    const maxTrade = (state.nav * BigInt(capBps)) / 10_000n;
    const maxTradeWithHeadroom = (maxTrade * BigInt(TRADE_CAP_HEADROOM_BPS)) / 10_000n;
    const effectiveMaxTrade = maxTradeWithHeadroom > 0n ? maxTradeWithHeadroom : maxTrade;
    const amountIn = bigintMin(desiredTrade, effectiveMaxTrade);

    if (amountIn === 0n) continue;

    const expectedSlippageBps = asset.maxSlippageBps;

    if (delta > 0) {
      const estimatedOut = (amountIn * (10_000n - BigInt(expectedSlippageBps))) / 10_000n;

      swaps.push({
        tokenIn: asset.address,
        tokenOut: state.baseAsset,
        amountIn,
        minAmountOut: estimatedOut,
        path: [asset.address, state.baseAsset],
        expectedSlippageBps,
      });
    } else {
      const price = state.pools.find((pool) => pool.token.toLowerCase() === asset.address.toLowerCase())?.spotPriceInBase ?? 0n;
      if (price === 0n) continue;

      const rawOut = convertBaseValueToTokenAmount(amountIn, price, asset.decimals);
      const minOut = (rawOut * (10_000n - BigInt(expectedSlippageBps))) / 10_000n;

      swaps.push({
        tokenIn: state.baseAsset,
        tokenOut: asset.address,
        amountIn,
        minAmountOut: minOut,
        path: [state.baseAsset, asset.address],
        expectedSlippageBps,
      });
    }
  }

  return swaps.filter((swap) => swap.amountIn > 0n);
}

export function buildStrategyOutput(state: VaultState): StrategyOutput {
  const newTargetBps = computeTargets(state);
  const swaps = computeSwapPlan(state, newTargetBps);

  const reasoning: Record<string, string> = {};
  for (const asset of state.assets) {
    const before = asset.currentWeightBps;
    const after = newTargetBps[asset.address] ?? asset.targetBps;
    const diff = after - before;
    reasoning[asset.address] = `${asset.symbol}: target ${before}bps -> ${after}bps (${diff >= 0 ? "+" : ""}${diff}bps)`;
  }

  return {
    newTargetBps,
    swaps,
    reasoning,
  };
}

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx < process.argv.length - 1) {
    return process.argv[idx + 1];
  }

  return undefined;
}

function stringifyBigInt(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}

async function runCli(): Promise<void> {
  if (!process.argv.includes("--dry-run")) {
    return;
  }

  const rpcUrl = parseArg("--rpc") ?? getRpcUrl();
  const vaultAddress = parseArg("--vault") ?? deployments.core?.indexVault;

  if (!vaultAddress) {
    throw new Error("Vault address is required. Provide --vault or set deployments.core.indexVault.");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const state = await readVaultState(vaultAddress, provider);
  const output = buildStrategyOutput(state);

  const payload = {
    mode: "dry-run",
    timestamp: new Date().toISOString(),
    state,
    output,
  };

  const outDir = path.join(process.cwd(), "agent", "sample-output");
  fs.mkdirSync(outDir, { recursive: true });

  const filename = `strategy-dry-run-${Date.now()}.json`;
  fs.writeFileSync(path.join(outDir, filename), `${stringifyBigInt(payload)}\n`, "utf8");

  console.log(stringifyBigInt(payload));
}

runCli().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
