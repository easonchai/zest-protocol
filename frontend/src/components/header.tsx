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
          <Link
            href="/request"
            className="text-primary font-medium cursor-pointer"
          >
            Request
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="bg-primary text-white font-medium px-4 py-2 rounded-lg hover:bg-primary/90"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="bg-red-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-600"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
                      >
                        {chain.hasIcon && (
                          <div
                            className="w-4 h-4 rounded-full overflow-hidden"
                            style={{
                              background: chain.iconBackground,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                className="w-4 h-4"
                              />
                            )}
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {chain.name?.replace("Ethereum", "cBTC")}
                        </span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
                      >
                        <span className="text-sm font-medium">
                          {ensName || account.displayName}
                        </span>
                        {account.displayBalance && (
                          <span className="text-sm text-gray-500">
                            ({account.displayBalance.replace("ETH", "cBTC")})
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
