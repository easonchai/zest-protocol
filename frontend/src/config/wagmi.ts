/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

export const citreaTestnet = {
  id: 5115,
  iconUrl:
    "https://s3.coinmarketcap.com/dexer/token/00822f2e4f2437c1a22b343a659dc2c9.jpg",
  name: "Citrea Testnet",
  nativeCurrency: {
    name: "cBTC",
    symbol: "cBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.citrea.xyz"],
    },
    public: {
      http: ["https://rpc.testnet.citrea.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Citrea Explorer",
      url: "https://explorer.testnet.citrea.xyz",
    },
  },
  testnet: true,
} as any;

export const config = getDefaultConfig({
  appName: "Zest Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [citreaTestnet],
  transports: {
    [citreaTestnet.id]: http(),
  },
  ssr: true,
});
