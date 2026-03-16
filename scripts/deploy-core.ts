import { ethers, network } from "hardhat";
import {
  DEPLOYMENTS_PATH,
  explorerAddressUrl,
  explorerTxUrl,
  loadDeployments,
  saveDeployments,
} from "../shared/config";

type Deployments = {
  uniswap?: {
    router: string;
    factory: string;
    weth: string;
  };
  tokens?: {
    baseAsset: string;
    assetA: string;
    assetB: string;
  };
  core?: {
    pdotToken: string;
    tokenRegistry: string;
    indexVault: string;
    xcmDemo?: string;
  };
  [key: string]: unknown;
};

async function resolveKeeperAddress(defaultAddress: string): Promise<string> {
  if (process.env.KEEPER_ADDRESS) {
    return process.env.KEEPER_ADDRESS;
  }

  if (process.env.KEEPER_PRIVATE_KEY) {
    return new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY).address;
  }

  return defaultAddress;
}

async function main(): Promise<void> {
  const deployments = loadDeployments();
  const uniswap = deployments.uniswap;
  const tokens = deployments.tokens;

  if (!uniswap?.router) {
    throw new Error("Missing uniswap.router in deployments/testnet.json");
  }
  if (!tokens?.baseAsset || !tokens.assetA || !tokens.assetB) {
    throw new Error("Missing tokens.baseAsset/assetA/assetB in deployments/testnet.json");
  }

  const [deployer] = await ethers.getSigners();
  const keeperAddress = await resolveKeeperAddress(deployer.address);

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Keeper: ${keeperAddress}`);

  const PDOT = await ethers.getContractFactory("PDOTToken");
  const pdot = await PDOT.deploy(deployer.address);
  await pdot.waitForDeployment();

  const Registry = await ethers.getContractFactory("TokenRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();

  const Vault = await ethers.getContractFactory("IndexVault");
  const vault = await Vault.deploy(
    deployer.address,
    tokens.baseAsset,
    await registry.getAddress(),
    await pdot.getAddress(),
    uniswap.router
  );
  await vault.waitForDeployment();

  const XcmDemo = await ethers.getContractFactory("XcmDemo");
  const xcmDemo = await XcmDemo.deploy(deployer.address);
  await xcmDemo.waitForDeployment();

  const minterRole = await pdot.MINTER_ROLE();
  await (await pdot.grantRole(minterRole, await vault.getAddress())).wait();

  const strategistRole = await vault.STRATEGIST_ROLE();
  const keeperRole = await vault.KEEPER_ROLE();
  const pauserRole = await vault.PAUSER_ROLE();

  await (await vault.grantRole(strategistRole, deployer.address)).wait();
  await (await vault.grantRole(keeperRole, keeperAddress)).wait();
  await (await vault.grantRole(pauserRole, deployer.address)).wait();

  const xcmKeeperRole = await xcmDemo.KEEPER_ROLE();
  await (await xcmDemo.grantRole(xcmKeeperRole, keeperAddress)).wait();

  const assetAToken = await ethers.getContractAt("MockERC20", tokens.assetA, deployer);
  const assetBToken = await ethers.getContractAt("MockERC20", tokens.assetB, deployer);

  const [assetAName, assetASymbol, assetADecimals] = await Promise.all([
    assetAToken.name(),
    assetAToken.symbol(),
    assetAToken.decimals(),
  ]);
  const [assetBName, assetBSymbol, assetBDecimals] = await Promise.all([
    assetBToken.name(),
    assetBToken.symbol(),
    assetBToken.decimals(),
  ]);

  await (await registry.setTokenMeta(tokens.assetA, assetAName, assetASymbol, assetADecimals, true)).wait();
  await (await registry.setTokenMeta(tokens.assetB, assetBName, assetBSymbol, assetBDecimals, true)).wait();

  await (await vault.addAsset(tokens.assetA, 5000, 300, 1000)).wait();
  await (await vault.addAsset(tokens.assetB, 5000, 300, 1000)).wait();
  await (await vault.setGuardrails(300, 1000)).wait();

  deployments.core = {
    ...(deployments.core ?? {}),
    pdotToken: await pdot.getAddress(),
    tokenRegistry: await registry.getAddress(),
    indexVault: await vault.getAddress(),
    xcmDemo: await xcmDemo.getAddress(),
  };

  saveDeployments(deployments);

  const pdotTx = pdot.deploymentTransaction();
  const registryTx = registry.deploymentTransaction();
  const vaultTx = vault.deploymentTransaction();
  const xcmTx = xcmDemo.deploymentTransaction();

  console.log("\n=== Core Deployment Summary ===");
  console.log(`PDOTToken:     ${await pdot.getAddress()}`);
  console.log(`TokenRegistry: ${await registry.getAddress()}`);
  console.log(`IndexVault:    ${await vault.getAddress()}`);
  console.log(`XcmDemo:       ${await xcmDemo.getAddress()}`);

  if (pdotTx) {
    console.log(`PDOT tx: ${pdotTx.hash}`);
    console.log(`PDOT tx link: ${explorerTxUrl(pdotTx.hash)}`);
  }
  if (registryTx) {
    console.log(`Registry tx: ${registryTx.hash}`);
    console.log(`Registry tx link: ${explorerTxUrl(registryTx.hash)}`);
  }
  if (vaultTx) {
    console.log(`Vault tx: ${vaultTx.hash}`);
    console.log(`Vault tx link: ${explorerTxUrl(vaultTx.hash)}`);
  }
  if (xcmTx) {
    console.log(`XcmDemo tx: ${xcmTx.hash}`);
    console.log(`XcmDemo tx link: ${explorerTxUrl(xcmTx.hash)}`);
  }

  console.log(`PDOT explorer: ${explorerAddressUrl(await pdot.getAddress())}`);
  console.log(`Registry explorer: ${explorerAddressUrl(await registry.getAddress())}`);
  console.log(`Vault explorer: ${explorerAddressUrl(await vault.getAddress())}`);
  console.log(`XcmDemo explorer: ${explorerAddressUrl(await xcmDemo.getAddress())}`);
  console.log(`\nUpdated ${DEPLOYMENTS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
