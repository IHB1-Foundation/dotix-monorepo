import { expect } from "chai";
import { ethers } from "hardhat";

describe("IndexVault deposit", function () {
  async function deployFixture() {
    const [admin, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const base = await MockERC20.deploy("Base", "BASE", 18, 0n, admin.address);
    await base.waitForDeployment();

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

    await base.mint(user1.address, ethers.parseUnits("1000", 18));
    await base.mint(user2.address, ethers.parseUnits("1000", 18));

    await base.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
    await base.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);

    return { admin, user1, user2, base, pdot, vault };
  }

  it("first deposit mints shares 1:1", async function () {
    const { user1, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("100", 18);

    await expect(vault.connect(user1).deposit(amountIn, amountIn))
      .to.emit(vault, "Deposit")
      .withArgs(user1.address, amountIn, amountIn);

    expect(await vault.calcNAV()).to.equal(amountIn);
  });

  it("second deposit is pro-rata to NAV", async function () {
    const { user1, user2, pdot, vault } = await deployFixture();
    const first = ethers.parseUnits("100", 18);
    const second = ethers.parseUnits("50", 18);

    await vault.connect(user1).deposit(first, 0);

    const supplyBefore = await pdot.totalSupply();
    const navBefore = await vault.calcNAV();
    const expected = (second * supplyBefore) / navBefore;

    await vault.connect(user2).deposit(second, expected);
    expect(await pdot.balanceOf(user2.address)).to.equal(expected);
  });

  it("reverts on minSharesOut slippage breach", async function () {
    const { user1, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("10", 18);

    await expect(vault.connect(user1).deposit(amountIn, amountIn + 1n)).to.be.revertedWith("slippage");
  });

  it("reverts when a tiny deposit rounds down to zero shares", async function () {
    const { admin, user1, user2, base, vault } = await deployFixture();
    const initialDeposit = ethers.parseUnits("100", 18);

    await vault.connect(user1).deposit(initialDeposit, 0);
    await base.mint(await vault.getAddress(), initialDeposit);

    await expect(vault.connect(user2).deposit(1n, 0)).to.be.revertedWith("shares");
    expect(await base.balanceOf(await vault.getAddress())).to.equal(initialDeposit * 2n);
    expect(await base.balanceOf(user2.address)).to.equal(ethers.parseUnits("1000", 18));
    expect(await base.balanceOf(admin.address)).to.equal(0);
  });

  it("increases PDOT totalSupply", async function () {
    const { user1, pdot, vault } = await deployFixture();
    const amountIn = ethers.parseUnits("25", 18);

    await vault.connect(user1).deposit(amountIn, 0);
    expect(await pdot.totalSupply()).to.equal(amountIn);
  });

  it("reverts while paused", async function () {
    const { admin, user1, vault } = await deployFixture();
    await vault.connect(admin).pause();

    await expect(vault.connect(user1).deposit(ethers.parseUnits("1", 18), 0)).to.be.revertedWithCustomError(
      vault,
      "EnforcedPause"
    );
  });
});
