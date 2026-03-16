const DEFAULT_CHAIN_ID = 420420417;
const DEFAULT_RPC_URL = "https://eth-rpc-testnet.polkadot.io/";
const DEFAULT_EXPLORER_URL = "https://blockscout-testnet.polkadot.io/";

function parseChainId(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CHAIN_ID;
}

function normalizeUrl(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/+$/, "");
}

export const APP_CHAIN_ID = parseChainId(process.env.NEXT_PUBLIC_CHAIN_ID);
export const APP_RPC_URL = normalizeUrl(process.env.NEXT_PUBLIC_RPC_URL, DEFAULT_RPC_URL);
export const APP_EXPLORER_URL = normalizeUrl(process.env.NEXT_PUBLIC_EXPLORER_URL, DEFAULT_EXPLORER_URL);

export function explorerTxUrl(hash: string): string {
  return `${APP_EXPLORER_URL}/tx/${hash}`;
}
