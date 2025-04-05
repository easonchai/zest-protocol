import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { WalletProvider } from "@/providers/wallet-provider";
import { Toaster } from "@/components/ui/sonner";

// Initialize Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <div className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
      <Toaster position="top-right" />
    </WalletProvider>
  );
}
