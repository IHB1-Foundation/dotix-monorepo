import fs from "node:fs";
import path from "node:path";

import { Contract, JsonRpcProvider, Wallet } from "ethers";
import * as dotenv from "dotenv";

import vaultArtifact from "../artifacts/contracts/IndexVault.sol/IndexVault.json";
import deployments from "../deployments/testnet.json";
import { explorerTxUrl, getRpcUrl } from "../shared/config";

import { explainStrategy } from "./explain";
import { acquireNonceLock } from "./nonce-lock";
import { buildStrategyOutput, readVaultState } from "./strategy";

dotenv.config();

const SAMPLE_OUTPUT_DIR = path.join(process.cwd(), "agent", "sample-output");

type Mode = "dry-run" | "execute";

function parseMode(): Mode {
  if (process.argv.includes("--execute")) return "execute";
  return "dry-run";
}

function jsonWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
}

function writeOutputFile(mode: Mode, payload: unknown): string {
  fs.mkdirSync(SAMPLE_OUTPUT_DIR, { recursive: true });
  const filename = `${mode}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(SAMPLE_OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, `${jsonWithBigInt(payload)}\n`, "utf8");
  return filepath;
}

function getVaultAddress(): string {
  const addr = deployments.core?.indexVault;
  if (!addr) {
    throw new Error("Missing deployments.core.indexVault");
  }

  return addr;
}

function getKeeperKey(): string {
  const key = process.env.KEEPER_PRIVATE_KEY;
  if (!key) {
    throw new Error("KEEPER_PRIVATE_KEY is required");
  }

  return key;
}

async function main(): Promise<void> {
  const mode = parseMode();
  const provider = new JsonRpcProvider(getRpcUrl());
  const keeper = new Wallet(getKeeperKey(), provider);
  const vaultAddress = getVaultAddress();

  console.log(`[1/4] Reading on-chain snapshot for vault ${vaultAddress}`);
  const state = await readVaultState(vaultAddress, provider);

  console.log("[2/4] Computing targets and swap plan");
  const output = buildStrategyOutput(state);

  console.log("[3/4] Building explainability lines");
  const explanation = explainStrategy(state, output);

  const basePayload: Record<string, unknown> = {
    mode,
    timestamp: new Date().toISOString(),
    vaultState: state,
    newTargets: output.newTargetBps,
    swaps: output.swaps,
    explanation,
  };

  const now = Math.floor(Date.now() / 1000);
  const nextRebalanceAt = state.lastRebalanceAt + state.cooldownSeconds;

  if (state.paused) {
    const payload = {
      ...basePayload,
      halted: true,
      reason: "Vault is paused",
    };
    const file = writeOutputFile(mode, payload);
    console.log("Vault is paused. Rebalancing halted.");
    console.log(`Saved: ${file}`);
    console.log(jsonWithBigInt(payload));
    return;
  }

  if (state.lastRebalanceAt > 0 && nextRebalanceAt > now) {
    const payload = {
      ...basePayload,
      halted: true,
      reason: `Cooldown active. Next rebalance in ${nextRebalanceAt - now}s`,
    };
    const file = writeOutputFile(mode, payload);
    console.log(payload.reason);
    console.log(`Saved: ${file}`);
    console.log(jsonWithBigInt(payload));
    return;
  }

  if (mode === "dry-run") {
    const file = writeOutputFile(mode, basePayload);
    console.log("[4/4] Dry-run complete (no transactions sent)");
    console.log(`Saved: ${file}`);
    console.log(jsonWithBigInt(basePayload));
    return;
  }

  if (output.swaps.length === 0) {
    const payload = {
      ...basePayload,
      halted: true,
      reason: "No swaps needed",
    };
    const file = writeOutputFile(mode, payload);
    console.log("No swaps needed. Execute mode finished without transaction.");
    console.log(`Saved: ${file}`);
    console.log(jsonWithBigInt(payload));
    return;
  }

  console.log("[4/4] Sending rebalance transaction");
  const vault = new Contract(vaultAddress, vaultArtifact.abi, keeper);
  const nonceLock = acquireNonceLock();

  try {
    const nonce = await provider.getTransactionCount(keeper.address, "pending");
    const tx = await vault.rebalance(output.swaps, { nonce });
    console.log(`tx hash: ${tx.hash}`);
    console.log(`Blockscout: ${explorerTxUrl(tx.hash)}`);

    const receipt = await tx.wait();
    const navAfter = await vault.calcNAV();

    const payload = {
      ...basePayload,
      txHash: tx.hash,
      nonce,
      blockNumber: receipt?.blockNumber ?? null,
      navAfter,
    };

    const file = writeOutputFile(mode, payload);
    console.log(`Saved: ${file}`);
    console.log(jsonWithBigInt(payload));
  } catch (error) {
    const payload = {
      ...basePayload,
      halted: true,
      reason: "Transaction reverted",
      error: String(error),
    };

    const file = writeOutputFile(mode, payload);
    console.error("Rebalance transaction failed.");
    console.error(`Saved: ${file}`);
    console.error(jsonWithBigInt(payload));
    throw error;
  } finally {
    nonceLock.release();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
