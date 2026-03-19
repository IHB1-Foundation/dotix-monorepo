import { expect } from "chai";
import { ethers, network } from "hardhat";

const XCM_PRECOMPILE = "0x00000000000000000000000000000000000a0000";

describe("XcmDemo", function () {
  async function deployFixture() {
    const [admin, keeper, outsider] = await ethers.getSigners();

    const MockPrecompile = await ethers.getContractFactory("MockXcmPrecompile");
    const mock = await MockPrecompile.deploy();
    await mock.waitForDeployment();

    const code = await ethers.provider.getCode(await mock.getAddress());
    await network.provider.send("hardhat_setCode", [XCM_PRECOMPILE, code]);

    const XcmDemo = await ethers.getContractFactory("XcmDemo");
    const demo = await XcmDemo.deploy(admin.address);
    await demo.waitForDeployment();

    const keeperRole = await demo.KEEPER_ROLE();
    await demo.grantRole(keeperRole, keeper.address);

    return { demo, admin, keeper, outsider };
  }

  it("demoWeigh proxies weighMessage", async function () {
    const { demo } = await deployFixture();

    const result = await demo.demoWeigh("0x0102");
    expect(result[0]).to.equal(123456n);
    expect(result[1]).to.equal(789n);
  });

  it("demoExecute requires KEEPER_ROLE", async function () {
    const { demo, outsider } = await deployFixture();

    await expect(demo.connect(outsider).demoExecute("0x0102", 1000, 1000)).to.be.revertedWithCustomError(
      demo,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("demoExecute emits ExecuteResult", async function () {
    const { demo, keeper } = await deployFixture();

    await expect(demo.connect(keeper).demoExecute("0x0102", 1000, 1000))
      .to.emit(demo, "ExecuteResult")
      .withArgs("0x0102", keeper.address);
  });

  it("weighDefault uses DEFAULT_MESSAGE", async function () {
    const { demo } = await deployFixture();

    const defaultResult = await demo.weighDefault();
    const customResult = await demo.demoWeigh(await demo.DEFAULT_MESSAGE());

    expect(defaultResult[0]).to.equal(customResult[0]);
    expect(defaultResult[1]).to.equal(customResult[1]);
  });

  it("precompile constant is fixed", async function () {
    const { demo } = await deployFixture();
    expect(await demo.XCM_PRECOMPILE()).to.equal(XCM_PRECOMPILE);
  });
});
