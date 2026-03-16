import { expect } from "chai";
import { ethers } from "hardhat";

describe("IndexVault redeem", function () {
  async function deployFixture() {
    const [admin, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const base = await MockERC20.deploy("Base", "BASE", 18, 0n, admin.address);
    const asset = await MockERC20.deploy("Asset", "AST", 18, 0n, admin.address);
    await Promise.all([base.waitForDeployment(), asset.waitForDeployment()]);

    const PDOT = await ethers.getContractFactory("PDOTToken");
    const pdot = await PDOT.deploy(admin.address);
    await pdot.waitForDeployment();

    const Registry = await ethers.getContractFactory("TokenRegistry");
    const registry = await Registry.deploy(admin.address);
    await registry.waitForDeployment();

    const Vault = await ethers.getContractFactory("IndexVault");
    const vault = await Vault.deploy(
      admin.address,
      await base.getAddress(),
      await registry.getAddress(),
      await pdot.getAddress(),
      admin.address
    );
    await vault.waitForDeployment();

    const minterRole = await pdot.MINTER_ROLE();
    await pdot.grantRole(minterRole, await vault.getAddress());

    await registry.setTokenMeta(await asset.getAddress(), "Asset", "AST", 18, true);
    await vault.addAsset(await asset.getAddress(), 5000, 300, 1000);

    await base.mint(user.address, ethers.parseUnits("1000", 18));
    await base.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);

    return { admin, user, base, asset, pdot, registry, vault };
  }

  async function deploySwapFixture() {
    const [admin, user] = await ethers.getSigners();

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
    const asset = await MockERC20.deploy("Asset", "AST", 18, 0n, admin.address);
    await Promise.all([base.waitForDeployment(), asset.waitForDeployment()]);

    const seedAmount = ethers.parseUnits("100000", 18);
    await base.mint(admin.address, seedAmount);
    await asset.mint(admin.address, seedAmount);

    await base.approve(await router.getAddress(), ethers.MaxUint256);
    await asset.approve(await router.getAddress(), ethers.MaxUint256);

    const deadline = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + 3600);
    await router.addLiquidity(
      await base.getAddress(),
      await asset.getAddress(),
      seedAmount,
      seedAmount,
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

    await registry.setTokenMeta(await asset.getAddress(), "Asset", "AST", 18, true);
    await vault.addAsset(await asset.getAddress(), 5000, 300, 1000);

    await base.mint(user.address, ethers.parseUnits("1000", 18));
    await base.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);

    return { admin, user, base, asset, pdot, registry, router, vault };
  }

  it("redeems back to base in simple case", async function () {
    const { user, base, vault } = await deployFixture();
    const amount = ethers.parseUnits("100", 18);

    await vault.connect(user).deposit(amount, 0);
    await expect(vault.connect(user).redeem(amount, amount - 1n))
      .to.emit(vault, "Redeem")
      .withArgs(user.address, amount, amount);

    expect(await base.balanceOf(user.address)).to.equal(ethers.parseUnits("1000", 18));
  });

  it("supports partial redeem pro-rata", async function () {
    const { user, base, pdot, vault } = await deployFixture();
    const amount = ethers.parseUnits("100", 18);
    const partial = ethers.parseUnits("40", 18);

    await vault.connect(user).deposit(amount, 0);
    await vault.connect(user).redeem(partial, partial);

    expect(await pdot.balanceOf(user.address)).to.equal(amount - partial);
    expect(await base.balanceOf(user.address)).to.equal(ethers.parseUnits("940", 18));
  });

  it("swaps underlying into base when redeem needs extra liquidity", async function () {
    const { user, base, asset, vault } = await deploySwapFixture();
    const depositAmount = ethers.parseUnits("100", 18);
    const donatedAsset = ethers.parseUnits("1", 18);

    await vault.connect(user).deposit(depositAmount, 0);
    await asset.mint(await vault.getAddress(), donatedAsset);

    await vault.connect(user).redeem(depositAmount, ethers.parseUnits("100.9", 18));

    expect(await base.balanceOf(user.address)).to.be.gt(ethers.parseUnits("1000", 18));
    expect(await asset.balanceOf(await vault.getAddress())).to.equal(0);
  });

  it("caps redeem payouts to post-swap realized NAV", async function () {
    const { user, base, asset, pdot, vault } = await deploySwapFixture();
    const depositAmount = ethers.parseUnits("100", 18);
    const donatedAsset = ethers.parseUnits("1000", 18);
    const sharesIn = ethers.parseUnits("50", 18);

    await vault.connect(user).deposit(depositAmount, 0);
    await asset.mint(await vault.getAddress(), donatedAsset);

    const supplyBefore = await pdot.totalSupply();
    const navBefore = await vault.calcNAV();
    const claimBefore = (sharesIn * navBefore) / supplyBefore;

    await vault.connect(user).redeem(sharesIn, 0);

    const userBaseBalance = await base.balanceOf(user.address);
    const preRedeemBaseBalance = ethers.parseUnits("900", 18);
    expect(userBaseBalance).to.be.lt(preRedeemBaseBalance + claimBefore);
  });

  it("reverts on minBaseOut slippage", async function () {
    const { user, vault } = await deployFixture();
    const amount = ethers.parseUnits("10", 18);

    await vault.connect(user).deposit(amount, 0);
    await expect(vault.connect(user).redeem(amount, amount + 1n)).to.be.revertedWith("slippage");
  });

  it("burns PDOT on redeem", async function () {
    const { user, pdot, vault } = await deployFixture();
    const amount = ethers.parseUnits("50", 18);

    await vault.connect(user).deposit(amount, 0);
    await vault.connect(user).redeem(ethers.parseUnits("20", 18), 0);

    expect(await pdot.totalSupply()).to.equal(ethers.parseUnits("30", 18));
  });

  it("emergency redeem works only while paused", async function () {
    const { admin, user, asset, base, vault } = await deployFixture();
    const amount = ethers.parseUnits("100", 18);

    await vault.connect(user).deposit(amount, 0);
    await asset.mint(await vault.getAddress(), ethers.parseUnits("20", 18));

    await expect(vault.connect(user).emergencyRedeemToUnderlying(ethers.parseUnits("50", 18)))
      .to.be.revertedWithCustomError(vault, "ExpectedPause");

    await vault.connect(admin).pause();

    await vault.connect(user).emergencyRedeemToUnderlying(ethers.parseUnits("50", 18));

    expect(await base.balanceOf(user.address)).to.equal(ethers.parseUnits("950", 18));
    expect(await asset.balanceOf(user.address)).to.equal(ethers.parseUnits("10", 18));
  });
});
