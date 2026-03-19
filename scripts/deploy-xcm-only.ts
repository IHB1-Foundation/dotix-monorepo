import { ethers, network } from "hardhat";
import {
  DEPLOYMENTS_PATH,
  explorerAddressUrl,
  explorerTxUrl,
  loadDeployments,
  saveDeployments,
} from "../shared/config";

async function resolveKeeperAddress(): Promise<string> {
  if (process.env.KEEPER_ADDRESS) {
    return process.env.KEEPER_ADDRESS;
  }

  if (process.env.KEEPER_PRIVATE_KEY) {
    return new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY).address;
  }

  throw new Error("KEEPER_ADDRESS or KEEPER_PRIVATE_KEY required");
}

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const keeperAddress = await resolveKeeperAddress();

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Keeper: ${keeperAddress}`);

  const XcmDemo = await ethers.getContractFactory("XcmDemo");
  const xcmDemo = await XcmDemo.deploy(deployer.address);
  await xcmDemo.waitForDeployment();

  const xcmKeeperRole = await xcmDemo.KEEPER_ROLE();
  await (await xcmDemo.grantRole(xcmKeeperRole, keeperAddress)).wait();

  const deployments = loadDeployments();
  deployments.core = {
    ...(deployments.core ?? {}),
    xcmDemo: await xcmDemo.getAddress(),
  };
  saveDeployments(deployments);

  const xcmTx = xcmDemo.deploymentTransaction();

  console.log("\n=== XcmDemo Redeployment ===");
  console.log(`XcmDemo: ${await xcmDemo.getAddress()}`);
  if (xcmTx) {
    console.log(`Deploy tx: ${xcmTx.hash}`);
    console.log(`Deploy tx link: ${explorerTxUrl(xcmTx.hash)}`);
  }
  console.log(`Explorer: ${explorerAddressUrl(await xcmDemo.getAddress())}`);
  console.log(`\nUpdated ${DEPLOYMENTS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
