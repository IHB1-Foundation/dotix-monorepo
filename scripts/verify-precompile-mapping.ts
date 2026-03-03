import hre from "hardhat";

interface AssetCheck {
  label: string;
  assetId: number;
}

const knownAssets: AssetCheck[] = [
  { label: "USDT", assetId: 1984 },
  { label: "USDC", assetId: 1337 },
  { label: "DOTX", assetId: 2000 },
];

function assetIdToAddress(assetId: number): string {
  const normalized = assetId >>> 0;
  const hex = normalized.toString(16).padStart(8, "0");
  return `0xFFFFFFFF000000000000000000000000${hex}`;
}

function isPrecompile(code: string): boolean {
  return code !== "0x";
}

async function main(): Promise<void> {
  const provider = hre.ethers.provider;
  const rows: Array<Record<string, string | number>> = [];

  for (const asset of knownAssets) {
    const address = assetIdToAddress(asset.assetId);
    const code = await provider.getCode(address);
    rows.push({
      asset: asset.label,
      assetId: asset.assetId,
      address,
      codeBytes: code === "0x" ? 0 : Math.max((code.length - 2) / 2, 0),
      detected: isPrecompile(code) ? "yes" : "no",
    });
  }

  console.table(rows);
  console.log(`Checked ${rows.length} known assetId mapping(s) on network: ${hre.network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
