import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

// Initialize Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}
