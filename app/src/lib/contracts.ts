import indexVaultArtifact from "../../../artifacts/contracts/IndexVault.sol/IndexVault.json";
import pdotArtifact from "../../../artifacts/contracts/PDOTToken.sol/PDOTToken.json";
import registryArtifact from "../../../artifacts/contracts/TokenRegistry.sol/TokenRegistry.json";
import routerArtifact from "../../../artifacts/contracts/uniswap/UniswapV2Router02.sol/UniswapV2Router02.json";
import deploymentsJson from "../../../deployments/testnet.json";
import type { Abi } from "viem";

type Deployments = {
  uniswap?: {
    router?: string;
  };
  core?: {
    indexVault?: string;
    pdotToken?: string;
    tokenRegistry?: string;
  };
};

const deployments = deploymentsJson as Deployments;

export const VAULT_ADDRESS = deployments.core?.indexVault ?? "0x0000000000000000000000000000000000000000";
export const PDOT_ADDRESS = deployments.core?.pdotToken ?? "0x0000000000000000000000000000000000000000";
export const REGISTRY_ADDRESS = deployments.core?.tokenRegistry ?? "0x0000000000000000000000000000000000000000";
export const ROUTER_ADDRESS = deployments.uniswap?.router ?? "0x0000000000000000000000000000000000000000";

export const INDEX_VAULT_ABI = indexVaultArtifact.abi as Abi;
export const PDOT_ABI = pdotArtifact.abi as Abi;
export const REGISTRY_ABI = registryArtifact.abi as Abi;
export const ROUTER_ABI = routerArtifact.abi as Abi;
