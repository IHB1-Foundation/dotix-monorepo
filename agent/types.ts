export interface AssetSnapshot {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  currentWeightBps: number;
  targetBps: number;
  maxSlippageBps: number;
  maxTradeBps: number;
}

export interface PoolSnapshot {
  token: string;
  reserveToken: bigint;
  reserveBase: bigint;
  spotPriceInBase: bigint;
}

export interface VaultState {
  vault: string;
  baseAsset: string;
  nav: bigint;
  totalSupply: bigint;
  assets: AssetSnapshot[];
  pools: PoolSnapshot[];
  cooldownSeconds: number;
  lastRebalanceAt: number;
  maxNavTradeBps: number;
  paused: boolean;
}

export interface SwapPlan {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  path: string[];
  expectedSlippageBps: number;
}

export interface StrategyOutput {
  newTargetBps: Record<string, number>;
  swaps: SwapPlan[];
  reasoning: Record<string, string>;
}
