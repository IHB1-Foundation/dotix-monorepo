import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenRegistry", function () {
  async function deployFixture() {
    const [admin, outsider] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("TokenRegistry");
    const registry = await Registry.deploy(admin.address);
    await registry.waitForDeployment();
    return { registry, admin, outsider };
  }

  it("set/get token metadata round-trip", async function () {
    const { registry, admin } = await deployFixture();
    const token = "0x0000000000000000000000000000000000001001";

    await expect(
      registry.connect(admin).setTokenMeta(token, "Token A", "TKA", 18, true)
    )
      .to.emit(registry, "TokenMetaUpdated")
      .withArgs(token, "", "TKA", false, true);

    const meta = await registry.getTokenMeta(token);
    expect(meta.name).to.equal("Token A");
    expect(meta.symbol).to.equal("TKA");
    expect(meta.decimals).to.equal(18);
    expect(meta.enabled).to.equal(true);
  });

  it("isEnabled toggles correctly", async function () {
    const { registry, admin } = await deployFixture();
    const token = "0x0000000000000000000000000000000000001002";

    await registry.connect(admin).setTokenMeta(token, "Token B", "TKB", 6, true);
    expect(await registry.isEnabled(token)).to.equal(true);

    await registry.connect(admin).setTokenMeta(token, "Token B", "TKB", 6, false);
    expect(await registry.isEnabled(token)).to.equal(false);
  });

  it("allTokens returns unique registrations", async function () {
    const { registry, admin } = await deployFixture();
    const token1 = "0x0000000000000000000000000000000000001003";
    const token2 = "0x0000000000000000000000000000000000001004";

    await registry.connect(admin).setTokenMeta(token1, "Token C", "TKC", 18, true);
    await registry.connect(admin).setTokenMeta(token2, "Token D", "TKD", 18, true);
    await registry.connect(admin).setTokenMeta(token1, "Token C2", "TKC2", 18, false);

    const list = await registry.allTokens();
    expect(list).to.deep.equal([token1, token2]);
  });

  it("supports paginated token reads", async function () {
    const { registry, admin } = await deployFixture();
    const tokens = [
      "0x0000000000000000000000000000000000001010",
      "0x0000000000000000000000000000000000001011",
      "0x0000000000000000000000000000000000001012",
    ];

    for (const token of tokens) {
      await registry.connect(admin).setTokenMeta(token, `Token-${token.slice(-2)}`, "TOK", 18, true);
    }

    expect(await registry.tokenCount()).to.equal(3);
    expect(await registry.getTokens(1, 2)).to.deep.equal(tokens.slice(1));
    expect(await registry.getTokens(10, 2)).to.deep.equal([]);
  });

  it("unregistered token is disabled", async function () {
    const { registry } = await deployFixture();
    const unknown = "0x0000000000000000000000000000000000009999";
    expect(await registry.isEnabled(unknown)).to.equal(false);
  });

  it("only admin can set metadata", async function () {
    const { registry, outsider } = await deployFixture();

    await expect(
      registry.connect(outsider).setTokenMeta(
        "0x0000000000000000000000000000000000001005",
        "Token E",
        "TKE",
        18,
        true
      )
    ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
  });

  it("zero token address reverts", async function () {
    const { registry, admin } = await deployFixture();

    await expect(
      registry.connect(admin).setTokenMeta(ethers.ZeroAddress, "Zero", "ZERO", 18, true)
    ).to.be.revertedWith("zero token");
  });
});
