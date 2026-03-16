import http from "node:http";

import { JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";

import deployments from "../deployments/testnet.json";
import { getRpcUrl } from "../shared/config";

import { explainStrategy } from "./explain";
import { isAuthorizedRequest } from "./plan-auth";
import { buildStrategyOutput, readVaultState } from "./strategy";

dotenv.config();

function jsonWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
}

function getVaultAddress(): string {
  const address = deployments.core?.indexVault;
  if (!address) {
    throw new Error("Missing deployments.core.indexVault");
  }

  return address;
}

function getPort(): number {
  return Number(process.env.PORT ?? 8080);
}

async function buildPlanResponse(): Promise<{ file: string; payload: unknown }> {
  const provider = new JsonRpcProvider(getRpcUrl());
  const vaultAddress = getVaultAddress();

  const state = await readVaultState(vaultAddress, provider);
  const output = buildStrategyOutput(state);
  const explanation = explainStrategy(state, output);

  const payload = {
    mode: "dry-run",
    timestamp: new Date().toISOString(),
    vaultState: state,
    newTargets: output.newTargetBps,
    swaps: output.swaps,
    explanation,
  };

  return {
    file: `railway-live-${Date.now()}.json`,
    payload,
  };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(jsonWithBigInt(body));
}

async function handler(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "dotix-agent-plan-api" });
    return;
  }

  if (url.pathname === "/agent-plan") {
    if (!isAuthorizedRequest(req.headers)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const plan = await buildPlanResponse();
      sendJson(res, 200, plan);
    } catch (error) {
      sendJson(res, 500, { error: String(error) });
    }
    return;
  }

  sendJson(res, 404, { error: "Not Found" });
}

const server = http.createServer((req, res) => {
  void handler(req, res);
});

const port = getPort();
server.listen(port, () => {
  console.log(`Agent plan API listening on :${port}`);
  console.log(`GET /health`);
  console.log(`GET /agent-plan`);
});
