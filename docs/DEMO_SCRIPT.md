# 90-Second Demo Script

## 0-10s: Connect + Network

1. Open `http://localhost:3000`.
2. Click wallet connect.
3. Show NetworkGuard auto-switch prompt to chain `420420417`.

Expected: wallet connected, dashboard visible.

## 10-30s: Dashboard Snapshot

1. Show NAV, PDOT price, total supply cards.
2. Show per-asset weight bars and rebalance status cooldown.

Narration: "Weights and metadata come from on-chain vault + TokenRegistry, not hardcoded token metadata."

## 30-50s: Deposit / Redeem Flow

1. Move to Deposit page.
2. Run approve -> deposit flow.
3. Show pending/confirmed tx status with Blockscout link.

Narration: "Deposit mints PDOT shares with slippage protection."

## 50-70s: Autopilot

1. Move to Autopilot page.
2. Click `Generate Plan`.
3. Show proposed targets, swap table, and explanation bullets.
4. If keeper role present, execute rebalance.

Narration: "Agent output is deterministic and fully explainable."

## 70-85s: XCM Demo

1. Move to XCM page.
2. Click `Weigh Default` and show refTime/proofSize.
3. Click `Execute Message` (keeper wallet).
4. Show tx hash + Blockscout link.

Narration: "This is Solidity-native XCM precompile access on Polkadot Hub."

## 85-90s: Wrap

- Restate differentiators: native assets + TokenRegistry + XCM + explainable autopilot.

## Recovery Notes

- Faucet delayed: switch to pre-funded local hardhat demo.
- RPC timeout: retry via fallback RPC in frontend config.
- Revert on slippage: increase tolerance to 1.0-2.0% for live demo.
