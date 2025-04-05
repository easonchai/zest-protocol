import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Zest Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});
