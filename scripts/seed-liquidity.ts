import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const DEPLOYMENTS_PATH = path.join(process.cwd(), "deployments", "testnet.json");
const MAX_UINT256 = (1n << 256n) - 1n;
const DECIMALS = 18;

interface Deployments {
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
  pools?: {
    baseAsset_assetA: string;
    baseAsset_assetB: string;
  };
  [key: string]: unknown;
}

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

function asAmount(n: string): bigint {
  return ethers.parseUnits(n, DECIMALS);
}

async function main(): Promise<void> {
  const deployments = loadDeployments();
  const uniswap = deployments.uniswap;

  if (!uniswap?.router || !uniswap.factory) {
    throw new Error("Missing uniswap deployment. Run scripts/deploy-uniswap.ts first.");
  }

  const [deployer] = await ethers.getSigners();
  const router = await ethers.getContractAt("UniswapV2Router02", uniswap.router, deployer);
  const factory = await ethers.getContractAt("UniswapV2Factory", uniswap.factory, deployer);

  const MockERC20 = await ethers.getContractFactory("MockERC20", deployer);
  const baseAsset = await MockERC20.deploy("Dotix Base Asset", "BASE", DECIMALS, 0n, deployer.address);
  const assetA = await MockERC20.deploy("Dotix Asset A", "ASTA", DECIMALS, 0n, deployer.address);
  const assetB = await MockERC20.deploy("Dotix Asset B", "ASTB", DECIMALS, 0n, deployer.address);

  await Promise.all([baseAsset.waitForDeployment(), assetA.waitForDeployment(), assetB.waitForDeployment()]);

  const baseAddr = await baseAsset.getAddress();
  const assetAAddr = await assetA.getAddress();
  const assetBAddr = await assetB.getAddress();

  const million = asAmount("1000000");
  await (await baseAsset.mint(deployer.address, million)).wait();
  await (await assetA.mint(deployer.address, million)).wait();
  await (await assetB.mint(deployer.address, million)).wait();

  await (await baseAsset.approve(uniswap.router, MAX_UINT256)).wait();
  await (await assetA.approve(uniswap.router, MAX_UINT256)).wait();
  await (await assetB.approve(uniswap.router, MAX_UINT256)).wait();

  const liquidityAmount = asAmount("100000");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  await (
    await router.addLiquidity(
      baseAddr,
      assetAAddr,
      liquidityAmount,
      liquidityAmount,
      0,
      0,
      deployer.address,
      deadline
    )
  ).wait();

  await (
    await router.addLiquidity(
      baseAddr,
      assetBAddr,
      liquidityAmount,
      liquidityAmount,
      0,
      0,
      deployer.address,
      deadline
    )
  ).wait();

  const pairA = await factory.getPair(baseAddr, assetAAddr);
  const pairB = await factory.getPair(baseAddr, assetBAddr);

  const pairAContract = await ethers.getContractAt("UniswapV2Pair", pairA, deployer);
  const pairBContract = await ethers.getContractAt("UniswapV2Pair", pairB, deployer);
  const [res0A, res1A] = await pairAContract.getReserves();
  const [res0B, res1B] = await pairBContract.getReserves();

  // Gate check: EOA swap against the pool.
  await (
    await router.swapExactTokensForTokens(
      asAmount("1"),
      0,
      [baseAddr, assetAAddr],
      deployer.address,
      deadline
    )
  ).wait();

  deployments.tokens = {
    baseAsset: baseAddr,
    assetA: assetAAddr,
    assetB: assetBAddr,
  };
  deployments.pools = {
    baseAsset_assetA: pairA,
    baseAsset_assetB: pairB,
  };
  saveDeployments(deployments);

  console.log(`Network: ${network.name}`);
  console.log(`baseAsset: ${baseAddr}`);
  console.log(`assetA: ${assetAAddr}`);
  console.log(`assetB: ${assetBAddr}`);
  console.log(`pool base/assetA: ${pairA}`);
  console.log(`pool base/assetB: ${pairB}`);
  console.log(`reserves base/assetA: ${res0A.toString()} / ${res1A.toString()}`);
  console.log(`reserves base/assetB: ${res0B.toString()} / ${res1B.toString()}`);
  console.log("swap check: swapExactTokensForTokens(base -> assetA) executed");
  console.log(`Updated ${DEPLOYMENTS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
