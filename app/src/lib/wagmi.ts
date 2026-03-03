import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http } from "viem";

export const polkadotHub = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 10,
  },
  rpcUrls: {
    default: {
      http: ["https://eth-rpc-testnet.polkadot.io/"],
    },
    public: {
      http: ["https://services.polkadothub-rpc.com/testnet/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io/",
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Dotix",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "dotix-local-project-id",
  chains: [polkadotHub],
  transports: {
    [polkadotHub.id]: http(polkadotHub.rpcUrls.default.http[0]),
  },
  ssr: true,
});
