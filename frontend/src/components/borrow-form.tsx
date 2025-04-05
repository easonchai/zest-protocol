"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BitcoinIcon } from "./btc-token-icon";
import { ZestTokenIcon } from "./zest-token-icon";
import { getBalance, getBtcPrice } from "@/utils/api";
import { ethers } from "ethers";

export function BorrowForm() {
  const { address } = useAccount();
  const [collateralAmount, setCollateralAmount] = useState("0.02");
  const [mintAmount, setMintAmount] = useState("0");
  const [interestRate, setInterestRate] = useState(5.3);
  const [selectedMintOption, setSelectedMintOption] = useState("safe");
  const [btcBalance, setBtcBalance] = useState("0.00");
  const [zestBalance, setZestBalance] = useState("0.00");
  const [btcPrice, setBtcPrice] = useState("0.00");
  const [liquidationPrice, setLiquidationPrice] = useState("0.00");

  // Collateral ratios
  const COLLATERAL_RATIOS = {
    safe: 2, // 200%
    medium: 1.5, // 150%
    risky: 1.25, // 125%
  };

  // Calculate borrow amounts based on collateral ratio
  const borrowAmounts = useMemo(() => {
    if (!collateralAmount || !btcPrice) return { safe: 0, medium: 0, risky: 0 };

    const collateralValue = parseFloat(collateralAmount) * parseFloat(btcPrice);
    return {
      safe: collateralValue / COLLATERAL_RATIOS.safe,
      medium: collateralValue / COLLATERAL_RATIOS.medium,
      risky: collateralValue / COLLATERAL_RATIOS.risky,
    };
  }, [collateralAmount, btcPrice]);

  // Update mint amount when collateral or selected option changes
  useEffect(() => {
    if (collateralAmount && btcPrice) {
      setMintAmount(
        borrowAmounts[
          selectedMintOption as keyof typeof COLLATERAL_RATIOS
        ].toFixed(2)
      );
    }
  }, [collateralAmount, btcPrice, selectedMintOption, borrowAmounts]);

  // Calculate collateral ratio
  const collateralRatio = useMemo(() => {
    if (!collateralAmount || !btcPrice || !mintAmount) return 0;
    const collateralValue = parseFloat(collateralAmount) * parseFloat(btcPrice);
    const borrowValue = parseFloat(mintAmount);
    return ((collateralValue / borrowValue) * 100).toFixed(1);
  }, [collateralAmount, btcPrice, mintAmount]);

  // Format number with K notation
  const formatNumberWithK = (num: number) => {
    if (num >= 1000) {
      return Math.floor(num / 1000) + "K";
    }
    return Math.floor(num).toString();
  };

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;
      try {
        const balance = await getBalance(address);
        // Format BTC balance to show 3 decimals
        const formattedBtcBalance = Number(
          ethers.formatEther(balance.cbtc)
        ).toFixed(3);
        setBtcBalance(formattedBtcBalance);
        setZestBalance(balance.zest);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setBtcBalance("0.000");
        setZestBalance("0.00");
      }
    };

    fetchBalances();
  }, [address]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getBtcPrice();
        setBtcPrice(price);
      } catch (error) {
        console.error("Error fetching BTC price:", error);
        setBtcPrice("0.00");
      }
    };

    fetchPrice();
  }, []);

  useEffect(() => {
    // Calculate liquidation price based on selected ratio
    if (collateralAmount && btcPrice && selectedMintOption) {
      const ratio =
        COLLATERAL_RATIOS[selectedMintOption as keyof typeof COLLATERAL_RATIOS];
      const liquidationValue = parseFloat(btcPrice) / ratio;
      setLiquidationPrice(liquidationValue.toFixed(2));
    }
  }, [collateralAmount, btcPrice, selectedMintOption]);

  const handleMaxClick = () => {
    setCollateralAmount(btcBalance);
  };

  const handleMintOptionClick = (option: keyof typeof COLLATERAL_RATIOS) => {
    setSelectedMintOption(option);
  };

  const handleCollateralChange = (value: string) => {
    setCollateralAmount(value);
  };

  const handleInterestRateChange = (value: number[]) => {
    setInterestRate(value[0]);
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Main Card */}
        <div className="p-6 space-y-6">
          {/* Collateral Section */}
          <div className="bg-[#FBFBFB] rounded-sm p-5">
            <div className="text-[#827A77] mb-1 text-sm">Collateral</div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={collateralAmount}
                  onChange={(e) => handleCollateralChange(e.target.value)}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
                <button
                  className="px-2 py-1 text-xs font-medium border border-[#D9D9D9] text-[#505050] rounded w-fit mt-1"
                  onClick={handleMaxClick}
                >
                  MAX
                </button>
              </div>
              <div className="flex items-start h-full">
                <div className="flex flex-col items-end h-full">
                  <div className="flex items-center">
                    <span className="text-xl font-extrabold mr-2 text-[#2A2A2A]">
                      BTC
                    </span>
                    <BitcoinIcon />
                  </div>
                  <div className="text-gray-400 font-semibold text-sm">
                    Bal: {btcBalance}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BTC Price and Max LTV */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[#B4B4B4] text-sm font-medium">
                BTC Price
              </span>
              <span className="ml-1 text-[#505050] text-sm font-medium">
                ${btcPrice}
              </span>
            </div>
            <div>
              <span className="text-[#B4B4B4] text-sm font-medium">
                Max LTV
              </span>
              <span className="ml-1 text-[#505050] text-sm font-medium">
                90.91%
              </span>
            </div>
          </div>

          {/* Mint Section */}
          <div className="bg-[#FBFBFB] rounded-sm p-5">
            <div className="text-[#827A77] mb-1 text-sm">Mint</div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
                <div className="flex space-x-2 mt-1">
                  <button
                    className={`px-2 py-1 text-xs font-medium flex items-center border border-[#EBE7E7] rounded-xs ${
                      selectedMintOption === "safe"
                        ? "bg-[#DCF6E4] text-[#168738] border-[#168738]"
                        : "bg-none text-[#6C6866]"
                    }`}
                    onClick={() => handleMintOptionClick("safe")}
                  >
                    <div className="w-2 h-2 rounded-full mr-1 bg-[#6AE084]"></div>
                    {formatNumberWithK(borrowAmounts.safe)}
                  </button>
                  <button
                    className={`px-2 py-1 text-xs font-medium flex items-center border border-[#EBE7E7] rounded-xs ${
                      selectedMintOption === "medium"
                        ? "bg-[#FFF8E6] text-[#B36A02] border-[#B36A02]"
                        : "bg-none text-[#6C6866]"
                    }`}
                    onClick={() => handleMintOptionClick("medium")}
                  >
                    <div className="w-2 h-2 rounded-full mr-1 bg-[#F8B312]"></div>
                    {formatNumberWithK(borrowAmounts.medium)}
                  </button>
                  <button
                    className={`px-2 py-1 text-xs font-medium flex items-center border border-[#EBE7E7] rounded-xs ${
                      selectedMintOption === "risky"
                        ? "bg-[#FEEFEC] text-[#B3401E] border-[#B3401E]"
                        : "bg-none text-[#6C6866]"
                    }`}
                    onClick={() => handleMintOptionClick("risky")}
                  >
                    <div className="w-2 h-2 rounded-full mr-1 bg-[#F3533E]"></div>
                    {formatNumberWithK(borrowAmounts.risky)}
                  </button>
                </div>
              </div>
              <div className="flex items-start h-full">
                <div className="flex flex-col items-end h-full">
                  <div className="flex items-center">
                    <span className="text-xl font-extrabold mr-2 text-[#2A2A2A]">
                      ZEST
                    </span>
                    <ZestTokenIcon />
                  </div>
                  <div className="text-gray-400 font-semibold text-sm">
                    Bal: {zestBalance}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidation Risk */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#6AE084] mr-1"></div>
              <span className="text-[#4A4A4A] text-xs font-medium">
                {selectedMintOption === "safe"
                  ? "Low"
                  : selectedMintOption === "medium"
                  ? "Medium"
                  : "High"}{" "}
                liquidation risk
              </span>
              <span className="ml-2 text-[#168738] bg-[#DCF6E4] text-xs px-1 py-0.5 rounded-[1px]">
                {collateralRatio}%
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-[#B4B4B4] text-xs font-medium">
                Liquidation price
              </span>
              <span className="ml-1 text-[#505050] text-xs font-medium">
                ${formatNumberWithK(Number(liquidationPrice))}
              </span>
            </div>
          </div>

          {/* Interest Rate Section */}
          <div className="bg-[#FBFBFB] rounded-sm p-5">
            <div className="text-[#827A77] mb-1 text-sm">Set interest rate</div>
            <div className="flex items-baseline">
              <span className="text-[2.75rem] leading-tight font-bold text-[#2A2A2A]">
                {interestRate}
              </span>
              <span className="text-xl text-[#4A4A4A] ml-1">% per year</span>
              <span className="text-[#827A77] text-sm ml-2">
                (200 ZEST / year)
              </span>
            </div>

            {/* Interest Rate Slider */}
            <div className="mt-4 relative">
              <div className="h-2 bg-[#EBE7E7] rounded-full relative">
                <div
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-[#CB4118] to-[#F8B312] rounded-full"
                  style={{ width: "60%" }}
                ></div>
                <div className="absolute top-0 left-0 w-full">
                  {/* Histogram bars */}
                  <div className="relative h-2">
                    <div className="absolute bottom-0 left-[20%] w-1 h-1 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[25%] w-1 h-2 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[30%] w-1 h-1.5 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[35%] w-1 h-3 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[40%] w-1 h-2 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[45%] w-1 h-4 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[50%] w-1 h-3 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[55%] w-1 h-2 bg-[#F8B312]"></div>
                    <div className="absolute bottom-0 left-[60%] w-1 h-1 bg-[#F8B312]"></div>
                  </div>
                </div>
                <div className="absolute top-[-4px] left-[60%] w-4 h-4 bg-white border-2 border-[#D9D9D9] rounded-full transform -translate-x-1/2"></div>
              </div>
              <Slider
                defaultValue={[5.3]}
                max={10}
                step={0.1}
                className="opacity-0 absolute top-0 left-0 w-full"
                onValueChange={handleInterestRateChange}
              />
            </div>

            {/* Risk Indicator */}
            <div className="flex items-center mt-4">
              <div className="w-2 h-2 rounded-full bg-[#F8B312] mr-1"></div>
              <span className="text-[#4A4A4A] font-medium text-xs">
                Medium redemption risk
              </span>
            </div>
          </div>

          {/* Estimate Fee */}
          <div className="flex justify-between items-center">
            <div className="text-[#827A77] text-sm">Estimated fee</div>
            <div className="text-[#827A77]">$0.06</div>
          </div>

          {/* Mint Button */}
          <Button className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-white rounded-sm">
            Mint
          </Button>
        </div>
      </div>
    </div>
  );
}
