# Troubleshooting

## 1) MetaMask chain mismatch

Symptoms: NetworkGuard warning persists.

Fix:
1. Click `Switch to Polkadot Hub` in the banner.
2. Verify chain id is `420420417`.

## 2) No PAS for gas

Symptoms: transactions fail with insufficient funds.

Fix:
1. Request PAS from faucet.
2. Confirm wallet balance before running deposit/rebalance/XCM execute.

## 3) RPC timeout / flaky reads

Symptoms: dashboard loads slowly or hooks fail.

Fix:
1. Switch RPC to fallback endpoint (`services.polkadothub-rpc.com/testnet`).
2. Refresh page after network stabilizes.

## 4) Transaction underpriced

Symptoms: tx rejected by node due fee settings.

Fix:
1. Retry transaction from wallet.
2. Increase max fee / priority fee in wallet advanced settings.

## 5) Token metadata missing or wrong

Symptoms: symbol/decimals not shown as expected.

Fix:
1. Confirm token is registered in `TokenRegistry`.
2. Verify `setTokenMeta` used correct symbol/decimals and `enabled=true`.

## 6) Agent plan not shown in Autopilot

Symptoms: `/api/agent-plan` returns 404.

Fix:
1. Run `bun run agent/execute.ts --dry-run`.
2. Ensure `agent/sample-output/*.json` files exist.

## 7) XCM execute button disabled

Symptoms: button disabled even with connected wallet.

Fix:
1. Verify wallet has `KEEPER_ROLE` in `XcmDemo` and vault.
2. Reconnect wallet and refresh role reads.
