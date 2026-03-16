import { defineChain, http } from "viem";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

import { APP_CHAIN_ID, APP_EXPLORER_URL, APP_RPC_URL } from "@/lib/network";

export const polkadotHub = defineChain({
  id: APP_CHAIN_ID,
  name: "Polkadot Hub TestNet",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 10,
  },
  rpcUrls: {
    default: {
      http: [APP_RPC_URL],
    },
    public: {
      http: [APP_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: APP_EXPLORER_URL,
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
