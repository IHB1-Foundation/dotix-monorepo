import { ethers, network } from "hardhat";

import deployments from "../deployments/testnet.json";

type Deployments = typeof deployments;

function requireAddress(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing deployments.${key}`);
  }
  return value;
}

async function main(): Promise<void> {
  const data = deployments as Deployments;
  const baseAsset = requireAddress(data.tokens?.baseAsset, "tokens.baseAsset");
  const vaultAddress = requireAddress(data.core?.indexVault, "core.indexVault");
  const pdotAddress = requireAddress(data.core?.pdotToken, "core.pdotToken");

  const [signer] = await ethers.getSigners();
  const base = await ethers.getContractAt("MockERC20", baseAsset, signer);
  const vault = await ethers.getContractAt("IndexVault", vaultAddress, signer);
  const pdot = await ethers.getContractAt("PDOTToken", pdotAddress, signer);

  const depositAmount = ethers.parseEther("1000");
  const sharesBefore = await pdot.balanceOf(signer.address);

  await (await base.approve(vaultAddress, depositAmount)).wait();
  await (await vault.deposit(depositAmount, 0)).wait();

  const sharesAfter = await pdot.balanceOf(signer.address);
  const minted = sharesAfter - sharesBefore;
  if (minted <= 0n) {
    throw new Error("Deposit minted zero shares");
  }

  const redeemAmount = minted / 2n;
  if (redeemAmount <= 0n) {
    throw new Error("Redeem amount is zero");
  }

  const baseBeforeRedeem = await base.balanceOf(signer.address);
  await (await pdot.approve(vaultAddress, redeemAmount)).wait();
  await (await vault.redeem(redeemAmount, 0)).wait();
  const baseAfterRedeem = await base.balanceOf(signer.address);

  if (baseAfterRedeem <= baseBeforeRedeem) {
    throw new Error("Redeem did not return base asset");
  }

  const nav = await vault.calcNAV();
  const totalSupply = await pdot.totalSupply();

  console.log(`Network: ${network.name}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`Deposit amount: ${depositAmount.toString()}`);
  console.log(`Minted shares: ${minted.toString()}`);
  console.log(`Redeemed shares: ${redeemAmount.toString()}`);
  console.log(`NAV after flow: ${nav.toString()}`);
  console.log(`PDOT totalSupply: ${totalSupply.toString()}`);
  console.log("QA smoke flow passed: deposit + redeem");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
