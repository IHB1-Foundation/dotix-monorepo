import fs from "node:fs";
import path from "node:path";

export const DEFAULT_RPC_URL = "https://eth-rpc-testnet.polkadot.io/";
export const DEFAULT_EXPLORER_URL = "https://blockscout-testnet.polkadot.io";
export const DEPLOYMENTS_PATH = path.join(process.cwd(), "deployments", "testnet.json");

export function getRpcUrl(): string {
  return process.env.RPC_URL ?? DEFAULT_RPC_URL;
}

export function explorerAddressUrl(address: string): string {
  return `${DEFAULT_EXPLORER_URL}/address/${address}`;
}

export function explorerTxUrl(txHash: string): string {
  return `${DEFAULT_EXPLORER_URL}/tx/${txHash}`;
}

export function loadDeployments<T extends object>(): T {
  try {
    return JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8")) as T;
  } catch {
    return {} as T;
  }
}

export function saveDeployments<T extends object>(next: T): void {
  fs.writeFileSync(DEPLOYMENTS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}
