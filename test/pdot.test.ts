import { expect } from "chai";
import { ethers } from "hardhat";

describe("DOTIXToken", function () {
  async function deployFixture() {
    const [admin, minter, user] = await ethers.getSigners();
    const DOTIXToken = await ethers.getContractFactory("DOTIXToken");
    const pdot = await DOTIXToken.deploy(admin.address);
    await pdot.waitForDeployment();

    return { pdot, admin, minter, user };
  }

  it("admin can grant MINTER_ROLE", async function () {
    const { pdot, admin, minter } = await deployFixture();
    const MINTER_ROLE = await pdot.MINTER_ROLE();

    await expect(pdot.connect(admin).grantRole(MINTER_ROLE, minter.address))
      .to.emit(pdot, "RoleGranted")
      .withArgs(MINTER_ROLE, minter.address, admin.address);

    expect(await pdot.hasRole(MINTER_ROLE, minter.address)).to.equal(true);
  });

  it("minter can mint and emits Transfer", async function () {
    const { pdot, admin, minter, user } = await deployFixture();
    const MINTER_ROLE = await pdot.MINTER_ROLE();
    await pdot.connect(admin).grantRole(MINTER_ROLE, minter.address);

    await expect(pdot.connect(minter).mint(user.address, 100n))
      .to.emit(pdot, "Transfer")
      .withArgs(ethers.ZeroAddress, user.address, 100n);

    expect(await pdot.balanceOf(user.address)).to.equal(100n);
    expect(await pdot.totalSupply()).to.equal(100n);
  });

  it("non-minter cannot mint", async function () {
    const { pdot, user } = await deployFixture();

    await expect(pdot.connect(user).mint(user.address, 1n)).to.be.revertedWithCustomError(
      pdot,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("minter can burn and totalSupply decreases", async function () {
    const { pdot, admin, minter, user } = await deployFixture();
    const MINTER_ROLE = await pdot.MINTER_ROLE();
    await pdot.connect(admin).grantRole(MINTER_ROLE, minter.address);

    await pdot.connect(minter).mint(user.address, 250n);
    await expect(pdot.connect(minter).burn(user.address, 50n))
      .to.emit(pdot, "Transfer")
      .withArgs(user.address, ethers.ZeroAddress, 50n);

    expect(await pdot.balanceOf(user.address)).to.equal(200n);
    expect(await pdot.totalSupply()).to.equal(200n);
  });
});
