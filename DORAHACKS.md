# Dotix — Polkadot-Native Index Vault

## One-Liner

A DeFi vault that *cannot exist on Ethereum* — it consumes Polkadot-native assets, speaks XCM, and rebalances itself with an explainable agent, all from Solidity.

---

## Problem

Polkadot Hub exposes native assets (Assets pallet) as ERC20 precompiles, but these precompiles lack `name()`, `symbol()`, and `decimals()`. Every Solidity dApp on Hub that touches native assets hits this metadata gap. There is no standard solution.

Meanwhile, DeFi protocols ported to Polkadot ignore the chain's native capabilities — they deploy custom ERC20 tokens instead of using real ecosystem assets, and they never touch XCM. The result: projects that could run identically on Ethereum, with nothing Polkadot-specific.

## Solution

Dotix is a DeFi protocol that **cannot be built identically on Ethereum**.

Users deposit a base asset and receive **DOTIX** shares. The vault holds a basket of Polkadot-native assets and maintains target weights. An off-chain autopilot agent analyzes on-chain DEX liquidity, proposes rebalancing strategies with human-readable explanations, and executes swaps through on-chain guardrails. After withdrawing, users can bridge assets to other parachains via XCM — directly from the UI.

Three things make this Polkadot-native:

1. **Assets pallet tokens consumed directly from Solidity** via ERC20 precompiles — real ecosystem assets, not custom deployments
2. **TokenRegistry** — an on-chain metadata store that solves the precompile metadata gap. Generalizable infrastructure for every Hub dApp, not a Dotix-specific hack
3. **XCM precompile** called from Solidity (`weighMessage` + `execute` + `send`) — cross-consensus messaging as a native feature, not a bridge. Integrated into the product as a Bridge page for post-withdraw cross-chain transfers

---

## Why This Matters

### Most "Polkadot DeFi" is just Ethereum DeFi on a different RPC endpoint.

Projects deploy their own ERC20 tokens, use standard AMMs, and call it Polkadot-native. Swap the RPC URL and the same contracts run on Arbitrum, Base, or any other EVM chain. Nothing about these protocols requires Polkadot to exist.

**Dotix is different.** Remove Polkadot and it breaks — the assets disappear, the metadata layer has no precompiles to solve for, and XCM calls have nowhere to go. This isn't a design choice for aesthetics; it's proof that Polkadot Hub's EVM is a **genuinely differentiated execution environment**, not just another L1 with Solidity support.

### What makes this meaningful:

- **TokenRegistry solves a real gap, not just ours.** Every Solidity dApp on Polkadot Hub that displays native asset info (wallets, DEXs, dashboards, lending protocols) hits the same `name()`/`symbol()`/`decimals()` wall. We ship a general-purpose on-chain solution that any project can adopt — infrastructure, not just an internal helper.

- **The agent is explainable by design, not by marketing.** Every rebalance decision comes with a human-readable rationale: why each weight shifted, why a trade was capped, what slippage to expect. The contract enforces guardrails on-chain — the agent proposes, the vault approves. No opaque AI, no admin override.

- **XCM from Solidity is underexplored territory.** Calling `weighMessage()` and `execute()` from a Solidity contract is possible today on Polkadot Hub but almost nobody demonstrates it. We do — and we surface the results in a frontend that makes cross-consensus messaging tangible, not theoretical.

### In one sentence:

Dotix doesn't just *run on* Polkadot — it *requires* Polkadot. That's the bar a Polkadot-native protocol should clear.

---

## How It Works

### Product Flow

```
User deposits Base Asset → Vault mints DOTIX shares
  → Autopilot reads vault balances + Uniswap reserves
    → Computes liquidity-weighted target allocations
      → Generates swap plan + human-readable explanation
        → KEEPER executes rebalance (on-chain guardrails enforced)
          → Portfolio weights shift toward targets
            → User redeems DOTIX → receives Base Asset back
              → User bridges Base Asset to other parachains via XCM
```

### Contracts

| Contract | Role |
|---|---|
| **IndexVault.sol** | Core: NAV accounting, deposit/redeem, rebalance with guardrails (cooldown, trade caps, slippage limits, allowlist) |
| **DOTIXToken.sol** | ERC-20 share token ("DOTIX"). Mint/burn gated to vault only |
| **TokenRegistry.sol** | On-chain metadata + allowlist for native asset precompiles. Solves `name()`/`symbol()`/`decimals()` gap |
| **XcmDemo.sol** | XCM precompile wrapper — `weighMessage()` + `execute()` + `send()` from Solidity. Powers the Bridge page |
| **AssetIdToErc20.sol** | Library: deterministic `assetId (uint32)` → precompile address conversion |

### Autopilot Agent

The agent is **not** an LLM black box. It runs a deterministic, auditable algorithm:

1. Reads vault balances and Uniswap V2 pool reserves on-chain
2. Computes liquidity-weighted target allocations (deeper pools → higher weight)
3. Builds a swap plan respecting per-asset trade caps, global NAV cap, and slippage limits
4. Outputs human-readable explanation for every decision:
   ```
   "Asset A pool reserves are 3.2× Asset B — increased target weight +400 bps"
   "Trade size capped at 5% NAV (maxNavTradeBps = 500)"
   "Expected: 100 BASE → ~97.2 TOKEN_A (2.8% slippage, max 3%)"
   ```
5. Executes via KEEPER role — the vault enforces all guardrails on-chain

The agent **proposes**. The contract **enforces**. No AI key has admin access.

### Guardrails

| Guardrail | Mechanism |
|---|---|
| Cooldown | Minimum seconds between rebalances |
| Max trade size | Global NAV cap + per-asset cap (bps) |
| Slippage | `minAmountOut` per swap + per-asset `maxSlippageBps` |
| Emergency stop | `pause()` halts all operations; `emergencyRedeem` still works |
| Asset allowlist | TokenRegistry `isEnabled()` enforced before every vault operation |
| Role separation | ADMIN / STRATEGIST / KEEPER / PAUSER — no single key controls everything |

---

## Architecture

```
┌──────────────────── Polkadot Hub TestNet ────────────────────┐
│                                                               │
│  Assets Pallet ──→ ERC20 Precompiles                          │
│  XCM Precompile (0x00..000a0000)                              │
│  UniswapV2 Router + Factory (deployed by us)                  │
│                                                               │
│  ┌── Dotix Protocol ────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  AssetIdToErc20 → TokenRegistry → IndexVault → DOTIXToken │ │
│  │                                                          │ │
│  │  XcmDemo ─────────────────────────────────────────────── │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────┬────────────────────┘
                        │                  │
              Next.js Frontend      Autopilot Agent
              wagmi + MetaMask      TypeScript (KEEPER key)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin (AccessControl, ReentrancyGuard, Pausable, SafeERC20) |
| DEX | Uniswap V2 (Factory + Router + WETH) deployed on Hub TestNet |
| Frontend | Next.js 14, React 18, wagmi 2, viem 2, RainbowKit, Tailwind CSS, Recharts |
| Agent | TypeScript, ethers.js, deterministic strategy algorithm |
| Network | Polkadot Hub TestNet (Chain ID: 420420417) |

---

## Polkadot-Native Features Used

### 1. ERC20 Precompiles (Assets Pallet)

Portfolio tokens are Polkadot-native assets exposed as ERC20 precompiles. The vault calls `transfer()`, `balanceOf()`, `approve()` on precompile addresses — consuming real ecosystem assets from Solidity without deploying custom tokens.

### 2. TokenRegistry — Solving the Metadata Gap

ERC20 precompiles do not expose `name()`, `symbol()`, or `decimals()`. This is a systemic problem: every Solidity dApp on Polkadot Hub that displays native asset information faces it.

Dotix ships `TokenRegistry.sol` — a permissioned on-chain metadata store that any contract can query. The vault enforces `isEnabled()` before accepting any token. The frontend always reads metadata from the registry, never from precompiles directly.

This is **infrastructure**, not a workaround. We ship it as a generalizable solution.

### 3. XCM Precompile

`XcmDemo.sol` wraps the XCM precompile at `0x00000000000000000000000000000000000a0000`:
- `weighMessage()` — dry-run to estimate execution cost (returns `refTime` + `proofSize`)
- `execute()` — execute a cross-consensus message from Solidity
- `send()` — send XCM to a destination parachain

The Bridge page lets users select a destination parachain (People Chain, Bridge Hub, Coretime), estimate XCM costs, and execute — integrated into the withdraw flow with a "Bridge to Parachain" CTA. Advanced users can switch to "Custom XCM" mode for raw hex input. This demonstrates that XCM is native to the EVM environment on Polkadot Hub — not bridged, not mocked.

---

## Deployed Contracts

All contracts are live on Polkadot Hub TestNet (Chain ID: `420420417`).

| Contract | Address |
|---|---|
| DOTIXToken | `0xd2FC0f34ddB6Daa916a4A548c20955CdbEBB070B` |
| TokenRegistry | `0xC5e775ea41Ee08485e9a6575f1Eb57E69398aCe1` |
| IndexVault | `0x344787673e89b96033c3bdc61Dd030A183D9859b` |
| XcmDemo | `0xef81Fa056E35d745f191Cc7728454309CCCBEa26` |
| Mock USDC | `0x45c7b128F068F2DCa353a605D590ceB24e039eD3` |
| DOT (Mock) | `0x41c5a4872DeB4e8A8Df5E6f4ED98F1AA95ce8307` |
| GLMR (Mock) | `0x61Db8AD896D0dd8d48d22937aB897500A3ADAAAE` |
| UniswapV2Router02 | `0x904d6B1fEf300c12f843811776E4C87c78F3B08E` |

---

## What We Built

| Component | Details |
|---|---|
| Smart Contracts | 5 contracts, all deployed to testnet |
| Tests | 40 test cases across 5 files, all passing |
| Frontend | 7 pages, 35 components, 12 custom hooks |
| Agent | Strategy engine + explainability + HTTP API + 16 sample outputs |
| Scripts | Deploy, seed liquidity, verify precompile mappings, sync ABIs |

### Frontend Pages

- **Dashboard** — Vault NAV, DOTIX price, per-asset weight bars (current vs target), rebalance status
- **Deposit / Withdraw** — Approve-then-deposit flow with slippage protection; standard + emergency redeem. Withdraw success links to Bridge
- **Autopilot** — Generate plan, view swap table + explanation panel, execute rebalance
- **Bridge** — Select parachain destination, estimate XCM cost, execute bridge. "Custom XCM" tab for raw hex input
- **Settings** — Admin controls for target weights and guardrails

---

## Known Limitations

| Limitation | Context |
|---|---|
| Spot pricing via AMM reserves | Manipulable; mitigated by trade caps + authorized keeper only |
| Centralized keeper | Hackathon scope; future: bond-based permissionless rebalancing |
| Admin-managed registry | Future: on-chain governance |
| Demo keys in `.env` | Testnet only — never for mainnet use |

---

## Future Work

- **Cross-parachain vault assets** — source vault assets from other parachains via XCM reserve transfers, making it a true multi-chain index fund
- **TWAP / oracle integration** for manipulation-resistant pricing
- **On-chain governance** for strategy updates and permissionless rebalancing
- **PVM port** — rewrite core logic in ink! for native Polkadot VM execution
- **TokenRegistry as ecosystem standard** — propose as Hub-wide metadata infrastructure