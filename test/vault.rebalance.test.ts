import { expect } from "chai";
import { ethers } from "hardhat";

describe("IndexVault rebalance", function () {
  async function deployFixture() {
    const [admin, keeper, strategist, outsider] = await ethers.getSigners();

    const WETH = await ethers.getContractFactory("WETH9");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const weth = await WETH.deploy();
    await weth.waitForDeployment();

    const factory = await Factory.deploy(admin.address);
    await factory.waitForDeployment();

    const router = await Router.deploy(await factory.getAddress(), await weth.getAddress());
    await router.waitForDeployment();

    const base = await MockERC20.deploy("Base", "BASE", 18, 0n, admin.address);
    const assetA = await MockERC20.deploy("Asset A", "ASTA", 18, 0n, admin.address);
    const assetB = await MockERC20.deploy("Asset B", "ASTB", 18, 0n, admin.address);
    await Promise.all([base.waitForDeployment(), assetA.waitForDeployment(), assetB.waitForDeployment()]);

    const million = ethers.parseUnits("1000000", 18);
    await base.mint(admin.address, million);
    await assetA.mint(admin.address, million);
    await assetB.mint(admin.address, million);

    await base.approve(await router.getAddress(), ethers.MaxUint256);
    await assetA.approve(await router.getAddress(), ethers.MaxUint256);
    await assetB.approve(await router.getAddress(), ethers.MaxUint256);

    const seed = ethers.parseUnits("100000", 18);
    const deadline = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + 3600);
    await router.addLiquidity(
      await base.getAddress(),
      await assetA.getAddress(),
      seed,
      seed,
      0,
      0,
      admin.address,
      deadline
    );
    await router.addLiquidity(
      await base.getAddress(),
      await assetB.getAddress(),
      seed,
      seed,
      0,
      0,
      admin.address,
      deadline
    );

    const PDOT = await ethers.getContractFactory("PDOTToken");
    const pdot = await PDOT.deploy(admin.address);
    await pdot.waitForDeployment();

    const Registry = await ethers.getContractFactory("TokenRegistry");
    const registry = await Registry.deploy(admin.address);
    await registry.waitForDeployment();

    await registry.setTokenMeta(await assetA.getAddress(), "Asset A", "ASTA", 18, true);
    await registry.setTokenMeta(await assetB.getAddress(), "Asset B", "ASTB", 18, true);

    const Vault = await ethers.getContractFactory("IndexVault");
    const vault = await Vault.deploy(
      admin.address,
      await base.getAddress(),
      await registry.getAddress(),
      await pdot.getAddress(),
      await router.getAddress()
    );
    await vault.waitForDeployment();

    const minterRole = await pdot.MINTER_ROLE();
    await pdot.grantRole(minterRole, await vault.getAddress());

    const KEEPER_ROLE = await vault.KEEPER_ROLE();
    const STRATEGIST_ROLE = await vault.STRATEGIST_ROLE();
    await vault.grantRole(KEEPER_ROLE, keeper.address);
    await vault.grantRole(STRATEGIST_ROLE, strategist.address);

    await vault.addAsset(await assetA.getAddress(), 5000, 300, 1000);
    await vault.addAsset(await assetB.getAddress(), 5000, 300, 1000);
    await vault.setGuardrails(300, 1000);

    await assetA.mint(await vault.getAddress(), ethers.parseUnits("1000", 18));

    return { admin, keeper, strategist, outsider, base, assetA, assetB, vault };
  }

  it("rebalances successfully and emits events", async function () {
    const { keeper, base, assetA, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("10", 18);

    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn,
      minAmountOut: 0,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await expect(vault.connect(keeper).rebalance([swap]))
      .to.emit(vault, "SwapExecuted")
      .and.to.emit(vault, "Rebalanced");

    expect(await vault.lastRebalanceAt()).to.be.gt(0);
  });

  it("reverts when cooldown has not elapsed", async function () {
    const { keeper, base, assetA, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("5", 18);

    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn,
      minAmountOut: 0,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await vault.connect(keeper).rebalance([swap]);
    await expect(vault.connect(keeper).rebalance([swap])).to.be.revertedWith("cooldown");
  });

  it("reverts when swap uses disabled token", async function () {
    const { admin, keeper, base, assetA, vault } = await deployFixture();
    await vault.connect(admin).setAssetEnabled(await assetA.getAddress(), false);

    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn: ethers.parseUnits("1", 18),
      minAmountOut: 0,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await expect(vault.connect(keeper).rebalance([swap])).to.be.revertedWith("token");
  });

  it("reverts when amountIn exceeds trade cap", async function () {
    const { admin, keeper, base, assetA, vault } = await deployFixture();
    await vault.connect(admin).setGuardrails(0, 100);

    const cap = await vault.calcMaxTradeSize(await assetA.getAddress());
    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn: cap + 1n,
      minAmountOut: 0,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await expect(vault.connect(keeper).rebalance([swap])).to.be.revertedWith("trade cap");
  });

  it("reverts when minAmountOut is too high", async function () {
    const { keeper, base, assetA, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("10", 18);

    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn,
      minAmountOut: amountIn,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await expect(vault.connect(keeper).rebalance([swap])).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
  });

  it("lets admin configure the swap deadline window", async function () {
    const { admin, vault } = await deployFixture();

    await expect(vault.connect(admin).setMaxDeadlineSeconds(45))
      .to.emit(vault, "MaxDeadlineUpdated")
      .withArgs(45);

    expect(await vault.maxDeadlineSeconds()).to.equal(45);
  });

  it("rejects zero deadline windows", async function () {
    const { admin, vault } = await deployFixture();

    await expect(vault.connect(admin).setMaxDeadlineSeconds(0)).to.be.revertedWith("deadline");
  });

  it("requires KEEPER_ROLE", async function () {
    const { outsider, base, assetA, vault } = await deployFixture();

    const swap = {
      tokenIn: await assetA.getAddress(),
      tokenOut: await base.getAddress(),
      amountIn: ethers.parseUnits("1", 18),
      minAmountOut: 0,
      path: [await assetA.getAddress(), await base.getAddress()],
    };

    await expect(vault.connect(outsider).rebalance([swap])).to.be.revertedWithCustomError(
      vault,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("setTargetWeights enforces sum==10000", async function () {
    const { strategist, assetA, assetB, vault } = await deployFixture();

    await expect(
      vault.connect(strategist).setTargetWeights(
        [await assetA.getAddress(), await assetB.getAddress()],
        [5000, 4000]
      )
    ).to.be.revertedWith("sum");
  });

  it("setTargetWeights requires STRATEGIST_ROLE", async function () {
    const { outsider, assetA, assetB, vault } = await deployFixture();

    await expect(
      vault.connect(outsider).setTargetWeights(
        [await assetA.getAddress(), await assetB.getAddress()],
        [5000, 5000]
      )
    ).to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount");
  });
});
