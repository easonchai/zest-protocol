"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getEnsName } from "@/utils/api";
import { ZestLogo } from "./zest-logo";
import Link from "next/link";

export function Header() {
  const { address } = useAccount();
  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnsName = async () => {
      if (!address) {
        setEnsName(null);
        return;
      }
      const name = await getEnsName(address);
      setEnsName(name);
    };

    fetchEnsName();
  }, [address]);

  return (
    <header className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center space-x-10">
        <ZestLogo />
        <div className="flex items-center space-x-7">
          <Link href="/" className="text-primary font-medium cursor-pointer">
            Staking
          </Link>
          <Link href="/pay" className="text-primary font-medium cursor-pointer">
            Pay
          </Link>
          <Link
            href="/borrow"
            className="text-primary font-medium cursor-pointer"
          >
            Borrow
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {ensName && <span className="text-sm text-gray-500">{ensName}</span>}
        <ConnectButton />
      </div>
    </header>
  );
}
