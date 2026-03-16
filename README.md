# Dotix — Polkadot-Native Index Vault

> **Polkadot Solidity Hackathon APAC 2026**
> Track 2: PVM Smart Contracts (Native Assets & Precompiles) | Track 1: EVM — DeFi + AI

**The first index vault protocol built natively on Polkadot Hub.**

Deposit a base asset, receive **PDOT** shares, and let the explainable autopilot agent rebalance your basket of Polkadot-native assets — all from Solidity, all on-chain, no bridges.

---

## Why This Is Not Just "Another DeFi App Ported to Polkadot"

Every capability below is unique to Polkadot Hub. None of it exists on Ethereum.

| Polkadot-Native Feature | How Dotix Uses It | Why It Matters |
|---|---|---|
| **Assets pallet → ERC20 precompiles** | Portfolio tokens are Polkadot native assets, consumed directly from Solidity | No custom token deployment needed; real ecosystem assets |
| **TokenRegistry** | Solves the metadata gap — precompile tokens don't expose `name()`/`symbol()`/`decimals()` | Generalizable infrastructure every future Hub dApp needs |
| **XCM precompile** | `weighMessage()` + `execute()` called from Solidity, live in the UI | Cross-consensus messaging — not a bridge, built into the protocol |
| **Explainable autopilot agent** | Algorithmic strategy reads on-chain + DEX state, explains every decision | DeFi automation that's auditable, not a black box |

---

## Live Deployment

| Item | Value |
|---|---|
| Network | Polkadot Hub TestNet |
| Chain ID | `420420417` |
| RPC | `https://eth-rpc-testnet.polkadot.io/` |
| Explorer | `https://blockscout-testnet.polkadot.io/` |
| PDOTToken | [`0x0B306BF915C4d645ff596e518fAf3F9669b97016`](https://blockscout-testnet.polkadot.io/address/0x0B306BF915C4d645ff596e518fAf3F9669b97016) |
| TokenRegistry | [`0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1`](https://blockscout-testnet.polkadot.io/address/0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1) |
| IndexVault | [`0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE`](https://blockscout-testnet.polkadot.io/address/0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE) |
| XcmDemo | [`0x68B1D87F95878fE05B998F19b66F4baba5De1aed`](https://blockscout-testnet.polkadot.io/address/0x68B1D87F95878fE05B998F19b66F4baba5De1aed) |

### Additional Deployed Components

| Component | Address |
|---|---|
| UniswapV2Factory | [`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`](https://blockscout-testnet.polkadot.io/address/0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512) |
| UniswapV2Router02 | [`0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`](https://blockscout-testnet.polkadot.io/address/0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0) |
| WETH9 | [`0x5FbDB2315678afecb367f032d93F642f64180aa3`](https://blockscout-testnet.polkadot.io/address/0x5FbDB2315678afecb367f032d93F642f64180aa3) |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Polkadot Hub TestNet                        │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Assets Pallet  │  │  XCM Precompile  │  │ UniswapV2     │  │
│  │  (native)       │  │  0x..0a0000      │  │ Router        │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────┬────────┘  │
│           │ ERC20              │ weighMessage/       │ swaps     │
│           │ precompile         │ execute             │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                    Dotix Protocol                          │  │
│  │                                                            │  │
│  │  AssetIdToErc20 ──► TokenRegistry ──► IndexVault          │  │
│  │  (library)          (metadata +       (NAV accounting +    │  │
│  │                      allowlist)        deposit/redeem/      │  │
│  │                                        rebalance)           │  │
│  │                                   ──► PDOTToken            │  │
│  │  XcmDemo ──────────────────────────── (ERC-20 shares)      │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────┘
                                 │
              ┌──────────────────┴────────────────────┐
              │                                        │
   ┌──────────▼──────────┐                 ┌──────────▼──────────┐
   │   Next.js Frontend  │                 │  Autopilot Agent    │
   │   wagmi + viem      │                 │  TypeScript         │
   │   MetaMask          │                 │  KEEPER key         │
   └─────────────────────┘                 └─────────────────────┘
```

### Contracts

| Contract | Role |
|---|---|
| `PDOTToken.sol` | ERC-20 share token — mint/burn gated to vault only |
| `TokenRegistry.sol` | On-chain metadata store + allowlist for Polkadot native assets |
| `IndexVault.sol` | Core: NAV accounting, deposit, redeem, rebalance with guardrails |
| `XcmDemo.sol` | XCM precompile wrapper — `weighMessage` + `execute` from Solidity |
| `libraries/AssetIdToErc20.sol` | Deterministic `assetId (uint32)` → ERC20 precompile address |

---

## The TokenRegistry Problem — and Why It Matters Beyond Dotix

When you call `IERC20(precompileAddress).name()` on a Polkadot Assets pallet token, it reverts.
The precompile exposes transfer/approve/balanceOf — but not metadata.

This is not a Dotix edge case. **Every** Solidity application on Polkadot Hub that touches native assets hits this.

Dotix ships `TokenRegistry.sol`: a simple, permissioned metadata store that any Hub contract can query. The vault enforces its allowlist (`isEnabled()`) before accepting any token. The UI always reads from the registry — never calls `name()` on precompiles directly.

We ship this as infrastructure, not as a workaround.

---

## Product Flow

### 1 — Connect & Switch

MetaMask detects chainId mismatch → one-click switch to Hub TestNet (`420420417`).

### 2 — Dashboard

Real-time view of:
- Vault AUM / NAV in base asset units
- PDOT total supply + price (NAV / supply)
- Per-asset: balance, current weight (bps), target weight (bps), deviation bar
- Rebalance status: cooldown remaining, last timestamp, pause status

### 3 — Deposit

Enter base asset amount → approve (SafeERC20) → deposit → PDOT minted to wallet.
Slippage protection via `minSharesOut`.

### 4 — Autopilot Rebalance

Click "Generate Plan":
1. Agent reads vault balances + Uniswap reserves on-chain
2. Computes liquidity-weighted target allocations
3. Builds swap plan respecting per-asset and global guardrails
4. Outputs human-readable explanation:

```
"Asset A pool reserves are 3.2× Asset B — increased target weight +400 bps."
"Trade size capped at 5% NAV (maxNavTradeBps = 500)."
"Expected: 100 BASE → ~97.2 TOKEN_A (2.8% slippage, max 3%)."
```

Click "Execute Rebalance" (KEEPER role) → tx confirmed → weights shift measurably on dashboard.

### 5 — XCM Demo

Click "Weigh Default Message" → `weighMessage()` returns `refTime` + `proofSize`.
Click "Execute" → tx confirmed → Blockscout explorer link.

XCM is native, not bridged. This runs directly from the Solidity contract.

### 6 — Redeem

Enter PDOT amount → `emergencyRedeemToUnderlying` (when paused) or standard redeem → base asset returned. Slippage protection via `minBaseOut`.

---

## Guardrails & Security

The autopilot **proposes** — the vault **enforces**. No AI key has admin access.

| Guardrail | Mechanism |
|---|---|
| Cooldown | Minimum seconds between rebalances (`cooldownSeconds`) |
| Max trade size | Global NAV cap (`maxNavTradeBps`) + per-asset cap (`maxTradeBps`) |
| Slippage | `minAmountOut` per swap + per-asset `maxSlippageBps` |
| Emergency stop | `pause()` halts deposit/redeem/rebalance; `emergencyRedeem` still works |
| Asset allowlist | TokenRegistry `isEnabled()` checked before every vault operation |
| Role separation | ADMIN / STRATEGIST / KEEPER / PAUSER — no single key controls everything |

OpenZeppelin modules: `AccessControl`, `ReentrancyGuard`, `Pausable`, `SafeERC20`.

### Known Limitations

| Limitation | Notes |
|---|---|
| Spot pricing via AMM reserves | Manipulable; mitigated by trade caps + authorized keeper only |
| Centralized keeper | Hackathon scope; future: bond-based permissionless rebalancing |
| Admin-managed registry | Future: on-chain governance |
| Demo key in `.env` | For hackathon only — never use on mainnet |

---

## Quick Start

### Prerequisites

```
Node >= 20
bun (package manager)
MetaMask browser extension
PAS testnet tokens (faucet below)
```

### Faucet

1. Open [Polkadot Hub TestNet docs](https://docs.polkadot.com) and follow faucet instructions.
2. Request PAS in OpenGuild Discord faucet/support channels.
3. Confirm PAS balance on chainId `420420417` in MetaMask before deploy/execute.

### Clone & Install

```bash
git clone https://github.com/your-org/dotix-monorepo
cd dotix-monorepo
bun install
cp .env.example .env
# Edit .env values:
# RPC_URL=https://eth-rpc-testnet.polkadot.io/
# PRIVATE_KEY=0x...
# KEEPER_PRIVATE_KEY=0x...
```

### Deploy DEX

```bash
# Compile contracts first
bun run compile

# Always pass --network polkadotHub for live testnet deployments.

# Deploy Uniswap V2 (Factory + Router + WETH)
bun run deploy:uniswap

# Create pools and seed liquidity
bun run seed
```

### Deploy Core Contracts

```bash
# Deploy PDOTToken + TokenRegistry + IndexVault + XcmDemo
bun run deploy:core

# Verify assetId → ERC20 precompile address mapping
bun run verify:precompile
```

### Run Tests

```bash
bun test
```

Latest local run (`2026-03-03`): `33 pass`, `0 fail` across 6 files.

### Run Frontend

```bash
cd app
bun install
bun dev
# open http://localhost:3000
```

### Run Autopilot Agent

```bash
# Dry run — compute plan, output JSON, no transactions
bun run agent/execute.ts --dry-run

# Execute — send rebalance transactions
bun run agent/execute.ts --execute
```

---

## Repo Structure

```
dotix-monorepo/
├── contracts/
│   ├── libraries/
│   │   └── AssetIdToErc20.sol      Deterministic assetId → precompile address
│   ├── PDOTToken.sol               ERC-20 share token
│   ├── TokenRegistry.sol           Metadata + allowlist for native assets
│   ├── IndexVault.sol              Core vault: NAV, deposit, redeem, rebalance
│   └── XcmDemo.sol                 XCM precompile wrapper
├── scripts/
│   ├── deploy-uniswap.ts           Deploy Factory + Router + WETH
│   ├── deploy-core.ts              Deploy Dotix protocol
│   ├── seed-liquidity.ts           Create + seed AMM pools
│   └── verify-precompile-mapping.ts  Verify assetId → address on testnet
├── test/
│   ├── vault.deposit.test.ts
│   ├── vault.redeem.test.ts
│   ├── vault.rebalance.test.ts
│   ├── registry.test.ts
│   └── xcm.demo.test.ts
├── app/                            Next.js frontend (wagmi + viem)
│   └── ...
├── agent/
│   ├── strategy.ts                 Liquidity-weighted allocation algorithm
│   ├── explain.ts                  Human-readable decision trace generator
│   ├── execute.ts                  Dry-run + live execution modes
│   └── sample-output/              Pre-generated agent output for demo
└── docs/
    ├── ARCHITECTURE.md
    ├── DEMO_SCRIPT.md
    └── TROUBLESHOOTING.md
```

---

## Demo Script (90 seconds)

```
0:00  Connect MetaMask → one-click auto-switch to Hub (chainId 420420417)
0:08  Dashboard: AUM, PDOT price, current weights vs targets (visual bars)
0:18  Deposit: 100 base asset → approve → confirm → PDOT minted
0:30  Autopilot: "Generate Plan" → explanation panel:
        "Asset A pool is 2.1× larger — target weight +300 bps"
0:45  "Execute Rebalance" → pending → confirmed → Blockscout link
0:55  Dashboard: weight bars shift toward targets (measurable delta)
1:05  XCM Demo: "Weigh Default Message" → refTime + proofSize rendered
1:15  "Execute" → tx confirmed → Blockscout explorer link
1:25  "Dotix runs on Polkadot Hub's native Assets pallet and XCM precompile,
       from Solidity. TokenRegistry solves a gap every Hub dApp faces.
       This is what Polkadot Hub unlocks."
```

---

## Demo Video

- Placeholder: `https://youtu.be/TBD-DOTIX-DEMO`

## Submission Checklist

- [x] Public GitHub repo with contracts + scripts + tests + frontend + agent
- [ ] All contracts verified on Blockscout testnet
- [x] README with network setup, faucet, deploy steps, demo steps, known limitations
- [x] Sample agent output in `agent/sample-output/`
- [ ] Demo video (1–3 minutes, narrated) — placeholder link above

---

## Hackathon

**Polkadot Solidity Hackathon APAC 2026**
Co-organized by OpenGuild × Web3 Foundation
Submission: March 20, 2026 | Demo Day: March 24–25, 2026

- Track 2 (Primary): PVM Smart Contracts — Native Assets & Precompiles
- Track 1 (Secondary): EVM Smart Contracts — DeFi + AI

---

## Future Work

| Area | Description |
|---|---|
| Cross-parachain swaps | Remote execution on Hydration via XCM transact |
| Yield strategies | LP fee harvesting, staking, auto-compounding |
| Better pricing | TWAP, multi-venue oracle aggregation |
| Governance | On-chain strategy updates, permissionless rebalancing |
| Formal verification | Echidna invariant tests, Foundry fuzzing |
| PVM port | Rewrite core vault in ink! for native PVM execution |
| TokenRegistry standard | Propose as ecosystem-wide metadata standard for Hub dApps |

---

## License

MIT
