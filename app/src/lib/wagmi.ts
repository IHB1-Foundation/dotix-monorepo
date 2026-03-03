import { defineChain, http } from "viem";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

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

export const wagmiConfig = createConfig({
  chains: [polkadotHub],
  connectors: [injected()],
  transports: {
    [polkadotHub.id]: http(polkadotHub.rpcUrls.default.http[0]),
  },
  ssr: true,
});
