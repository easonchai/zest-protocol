"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getEnsName } from "@/utils/api";

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
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold">Zest Protocol</span>
      </div>
      <div className="flex items-center space-x-4">
        {ensName && <span className="text-sm text-gray-500">{ensName}</span>}
        <ConnectButton />
      </div>
    </header>
  );
}
