import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const DEPLOYMENTS_PATH = path.join(process.cwd(), "deployments", "testnet.json");

type Deployments = {
  uniswap?: {
    weth: string;
    factory: string;
    router: string;
  };
  [key: string]: unknown;
};

function loadDeployments(): Deployments {
  try {
    const raw = fs.readFileSync(DEPLOYMENTS_PATH, "utf8");
    return JSON.parse(raw) as Deployments;
  } catch {
    return {};
  }
}

function saveDeployments(next: Deployments): void {
  fs.writeFileSync(DEPLOYMENTS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function explorerLink(address: string): string {
  const base = "https://blockscout-testnet.polkadot.io/address";
  return `${base}/${address}`;
}

function txLink(txHash: string): string {
  const base = "https://blockscout-testnet.polkadot.io/tx";
  return `${base}/${txHash}`;
}

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const WETH9 = await ethers.getContractFactory("WETH9");
  const weth = await WETH9.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();

  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  const Router = await ethers.getContractFactory("UniswapV2Router02");
  const router = await Router.deploy(factoryAddress, wethAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  const deployments = loadDeployments();
  deployments.uniswap = {
    weth: wethAddress,
    factory: factoryAddress,
    router: routerAddress,
  };
  saveDeployments(deployments);

  const wethTx = weth.deploymentTransaction();
  const factoryTx = factory.deploymentTransaction();
  const routerTx = router.deploymentTransaction();

  console.log("\n=== Uniswap Deployment Summary ===");
  console.log(`WETH9:    ${wethAddress}`);
  console.log(`Factory:  ${factoryAddress}`);
  console.log(`Router02: ${routerAddress}`);

  if (wethTx) {
    console.log(`WETH tx:    ${wethTx.hash}`);
    console.log(`WETH tx link: ${txLink(wethTx.hash)}`);
  }
  if (factoryTx) {
    console.log(`Factory tx: ${factoryTx.hash}`);
    console.log(`Factory tx link: ${txLink(factoryTx.hash)}`);
  }
  if (routerTx) {
    console.log(`Router tx:  ${routerTx.hash}`);
    console.log(`Router tx link: ${txLink(routerTx.hash)}`);
  }

  console.log(`WETH explorer:    ${explorerLink(wethAddress)}`);
  console.log(`Factory explorer: ${explorerLink(factoryAddress)}`);
  console.log(`Router explorer:  ${explorerLink(routerAddress)}`);
  console.log(`\nUpdated ${DEPLOYMENTS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
