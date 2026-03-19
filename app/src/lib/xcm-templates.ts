export interface ParachainDestination {
  id: string;
  name: string;
  paraId: number;
  icon: string;
  description: string;
  messageHex: `0x${string}`;
}

export const PARACHAIN_DESTINATIONS: ParachainDestination[] = [
  {
    id: "moonbeam",
    name: "Moonbeam",
    paraId: 2004,
    icon: "M",
    description: "EVM-compatible smart contract platform on Polkadot",
    messageHex: "0x03020100",
  },
  {
    id: "astar",
    name: "Astar",
    paraId: 2006,
    icon: "A",
    description: "Multi-VM hub supporting EVM and WASM smart contracts",
    messageHex: "0x03020100",
  },
  {
    id: "acala",
    name: "Acala",
    paraId: 2000,
    icon: "C",
    description: "DeFi hub with built-in DEX, staking, and stablecoin",
    messageHex: "0x03020100",
  },
];
