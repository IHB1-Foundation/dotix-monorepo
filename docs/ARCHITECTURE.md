# Dotix Architecture

## System Diagram

```text
                 Polkadot Hub TestNet
+-------------------------------------------------------------+
|                                                             |
|  Assets precompiles      XCM precompile        UniswapV2    |
|  (ERC20-like)            (0x...0a0000)         Router/Pair  |
|         |                      |                    |        |
|         +----------+-----------+--------------------+        |
|                    |                                    swaps |
|            +-------v-------------------------------------+    |
|            |             Dotix Contracts                 |    |
|            |                                             |    |
|            |  TokenRegistry ---> IndexVault ---> PDOT    |    |
|            |      ^                ^   ^                 |    |
|            |      |                |   +-- guardrails    |    |
|            | AssetIdToErc20     XcmDemo                  |    |
|            +---------------------------------------------+    |
+-------------------------------------------------------------+
             ^                                 ^
             |                                 |
      Next.js Frontend                 Off-chain Agent
   (dashboard/deposit/xcm)        (strategy/explain/execute)
```

## Contract Responsibilities

- `AssetIdToErc20.sol`: deterministic `assetId -> precompile` address conversion.
- `TokenRegistry.sol`: metadata + allowlist for tokens that cannot expose ERC20 metadata directly.
- `PDOTToken.sol`: vault share token; mint/burn only for authorized minter role.
- `IndexVault.sol`: NAV accounting, deposit/redeem, rebalance execution with guardrails.
- `XcmDemo.sol`: wraps XCM precompile `weightMessage` and `execute`.

## Role Hierarchy

- `DEFAULT_ADMIN_ROLE`: governance/admin settings.
- `STRATEGIST_ROLE`: updates target weights.
- `KEEPER_ROLE`: triggers `rebalance` and XCM execution.
- `PAUSER_ROLE`: emergency pause control.

## NAV Formula

- `NAV = baseBalance + Σ(assetBalance * spotPriceInBase)`
- Spot price source: Uniswap V2 pair reserves (`getSpotPrice` in vault).
- Limitation: spot prices are manipulable in low-liquidity environments.

## Polkadot-Native Differentiators

- Native assets consumed as Solidity-callable precompiles.
- Token metadata gap solved by on-chain registry.
- XCM precompile called directly from Solidity (`XcmDemo`).

## Known Boundaries

- Spot-price valuation only (no TWAP/oracle).
- Keeper-driven execution (not permissionless yet).
- Registry metadata is admin-managed.
