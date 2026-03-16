import { ethers, network, run } from "hardhat";

import { DEPLOYMENTS_PATH, explorerAddressUrl, loadDeployments } from "../shared/config";

type Deployments = {
  uniswap?: {
    router?: string;
  };
  tokens?: {
    baseAsset?: string;
  };
  core?: {
    pdotToken?: string;
    tokenRegistry?: string;
    indexVault?: string;
    xcmDemo?: string;
  };
};

type VerifyTarget = {
  address: string;
  contract: string;
  constructorArguments: unknown[];
};

function requireAddress(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label} in ${DEPLOYMENTS_PATH}`);
  }

  return value;
}

async function assertCodeDeployed(address: string, label: string): Promise<void> {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`No bytecode found for ${label} at ${address} on ${network.name}`);
  }
}

async function main(): Promise<void> {
  const deployments = loadDeployments<Deployments>();
  const baseAsset = requireAddress(deployments.tokens?.baseAsset, "tokens.baseAsset");
  const router = requireAddress(deployments.uniswap?.router, "uniswap.router");
  const pdotToken = requireAddress(deployments.core?.pdotToken, "core.pdotToken");
  const tokenRegistry = requireAddress(deployments.core?.tokenRegistry, "core.tokenRegistry");
  const indexVault = requireAddress(deployments.core?.indexVault, "core.indexVault");
  const xcmDemo = requireAddress(deployments.core?.xcmDemo, "core.xcmDemo");

  const adminAddress =
    process.env.VERIFY_ADMIN_ADDRESS ??
    process.env.KEEPER_ADDRESS ??
    "0x0000000000000000000000000000000000000001";

  const targets: VerifyTarget[] = [
    {
      address: pdotToken,
      contract: "contracts/PDOTToken.sol:PDOTToken",
      constructorArguments: [adminAddress],
    },
    {
      address: tokenRegistry,
      contract: "contracts/TokenRegistry.sol:TokenRegistry",
      constructorArguments: [adminAddress],
    },
    {
      address: indexVault,
      contract: "contracts/IndexVault.sol:IndexVault",
      constructorArguments: [adminAddress, baseAsset, tokenRegistry, pdotToken, router],
    },
    {
      address: xcmDemo,
      contract: "contracts/XcmDemo.sol:XcmDemo",
      constructorArguments: [adminAddress],
    },
  ];

  for (const target of targets) {
    await assertCodeDeployed(target.address, target.contract);

    console.log(`Verifying ${target.contract} at ${target.address}`);
    await run("verify:verify", target);
    console.log(`Verified: ${explorerAddressUrl(target.address)}#code`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
