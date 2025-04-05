"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { BitcoinIcon } from "./btc-token-icon";
import { ZestTokenIcon } from "./zest-token-icon";
import {
  getBalance,
  getBtcPrice,
  prepareCDP,
  recordCDP,
  checkCDPExists,
} from "@/utils/api";
import { ethers } from "ethers";
import InterestSlider from "./interest-slider";
import { toast } from "sonner";
import { parseEther } from "viem";

export function BorrowForm() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash: `0x${string}`) => {
        setTxHash(hash);
        setIsProcessing(true);
      },
      onError: (error: Error) => {
        console.error("Error creating CDP:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to create CDP"
        );
        setIsProcessing(false);
      },
    },
  });
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [collateralAmount, setCollateralAmount] = useState("0.02");
  const [mintAmount, setMintAmount] = useState("0");
  const [interestRate, setInterestRate] = useState(5.3);
  const [riskLevel, setRiskLevel] = useState<"high" | "medium" | "low">(
    "medium"
  );
  const [yearlyAmount, setYearlyAmount] = useState("0");
  const [selectedMintOption, setSelectedMintOption] = useState("safe");
  const [btcBalance, setBtcBalance] = useState("0.00");
  const [zestBalance, setZestBalance] = useState("0.00");
  const [btcPrice, setBtcPrice] = useState("0.00");
  const [liquidationPrice, setLiquidationPrice] = useState("0.00");
  const [isProcessing, setIsProcessing] = useState(false);

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
        // Format ZEST balance to show 3 decimals
        const formattedZestBalance = Number(
          ethers.formatEther(balance.zest)
        ).toFixed(2);
        setBtcBalance(formattedBtcBalance);
        setZestBalance(formattedZestBalance);
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

  // Calculate risk level based on interest rate
  useEffect(() => {
    if (interestRate <= 30) {
      setRiskLevel("high");
    } else if (interestRate <= 60) {
      setRiskLevel("medium");
    } else {
      setRiskLevel("low");
    }
  }, [interestRate]);

  // Calculate yearly amount based on interest rate and mint amount
  useEffect(() => {
    if (mintAmount && interestRate) {
      const mintValue = parseFloat(mintAmount.replace(/,/g, ""));
      const yearlyValue = (mintValue * interestRate) / 100;
      setYearlyAmount(yearlyValue.toFixed(2));
    }
  }, [mintAmount, interestRate]);

  // Handle transaction receipt
  useEffect(() => {
    if (receiptError) {
      console.error("Transaction failed:", receiptError);
      toast.error("Transaction failed");
      setIsProcessing(false);
      return;
    }

    if (receipt) {
      // Transaction confirmed, record CDP
      const recordCDPAndUpdate = async () => {
        try {
          await recordCDP(
            {
              owner: address!,
              collateral: ethers.parseEther(collateralAmount).toString(),
              debt: ethers.parseEther(mintAmount).toString(),
              interestRate: Math.round(interestRate * 100),
            },
            receipt.transactionHash
          );

          // Refresh balances
          const newBalances = await getBalance(address!);
          // Format BTC balance to show 3 decimals
          const formattedBtcBalance = Number(
            ethers.formatEther(newBalances.cbtc)
          ).toFixed(3);
          // Format ZEST balance to show 2 decimals
          const formattedZestBalance = Number(
            ethers.formatEther(newBalances.zest)
          ).toFixed(2);

          setBtcBalance(formattedBtcBalance);
          setZestBalance(formattedZestBalance);

          toast.success("CDP created successfully!");
        } catch (error) {
          console.error("Error recording CDP:", error);
          toast.error("Failed to record CDP");
        } finally {
          setIsProcessing(false);
        }
      };

      recordCDPAndUpdate();
    }
  }, [
    receipt,
    receiptError,
    address,
    collateralAmount,
    mintAmount,
    interestRate,
  ]);

  const handleMaxClick = () => {
    setCollateralAmount(btcBalance);
  };

  const handleMintOptionClick = (option: keyof typeof COLLATERAL_RATIOS) => {
    setSelectedMintOption(option);
  };

  const handleCollateralChange = (value: string) => {
    setCollateralAmount(value);
  };

  const handleInterestRateChange = (value: number) => {
    setInterestRate(value);
  };

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      // Validate inputs
      if (!collateralAmount || !mintAmount) {
        throw new Error("Please enter valid amounts");
      }

      // Prepare CDP transaction
      const cdpData = await prepareCDP({
        owner: address,
        collateral: ethers.parseEther(collateralAmount).toString(),
        debt: ethers.parseEther(mintAmount).toString(),
        interestRate: Math.round(interestRate * 100),
      });

      // Validate CDP data
      if (!cdpData.to || !cdpData.value) {
        throw new Error("Invalid CDP data received from server");
      }

      // Check if CDP exists
      const cdpExists = await checkCDPExists(address);

      if (cdpExists) {
        // If CDP exists, use addCollateral and mintDebt
        writeContract({
          address: cdpData.to as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "amount", type: "uint256" }],
              name: "addCollateral",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
            {
              inputs: [{ name: "amount", type: "uint256" }],
              name: "mintDebt",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "addCollateral",
          args: [ethers.parseEther(collateralAmount)],
          value: parseEther(collateralAmount),
        });

        // Mint additional debt
        writeContract({
          address: cdpData.to as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "amount", type: "uint256" }],
              name: "mintDebt",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "mintDebt",
          args: [ethers.parseEther(mintAmount)],
        });
      } else {
        // If no CDP exists, create a new one
        writeContract({
          address: cdpData.to as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "collateralAmount", type: "uint256" },
                { name: "debtAmount", type: "uint256" },
                { name: "interestRate", type: "uint256" },
              ],
              name: "openCDP",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
          ],
          functionName: "openCDP",
          args: [
            ethers.parseEther(collateralAmount),
            ethers.parseEther(mintAmount),
            BigInt(Math.round(interestRate * 100)),
          ],
          value: parseEther(collateralAmount),
        });
      }
    } catch (error) {
      console.error("Error creating CDP:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create CDP"
      );
      setIsProcessing(false);
    }
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
              <div
                className={`w-2 h-2 rounded-full mr-1 ${
                  selectedMintOption === "safe"
                    ? "bg-[#6AE084]"
                    : selectedMintOption === "medium"
                    ? "bg-[#F8B312]"
                    : "bg-[#F3533E]"
                }`}
              ></div>
              <span className="text-[#4A4A4A] text-xs font-medium">
                {selectedMintOption === "safe"
                  ? "Low"
                  : selectedMintOption === "medium"
                  ? "Medium"
                  : "High"}{" "}
                liquidation risk
              </span>
              <span
                className={`ml-2  text-xs px-1 py-0.5 rounded-[1px]
                ${
                  selectedMintOption === "safe"
                    ? "text-[#168738] bg-[#DCF6E4]"
                    : selectedMintOption === "medium"
                    ? "text-[#B36A02] bg-[#f6f2dc]"
                    : "text-[#B3401E] bg-[#f6dcdc]"
                }`}
              >
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
              <span className="text-xl leading-tight font-semibold text-[#2A2A2A]">
                {interestRate.toFixed(1)}
              </span>
              <span className="text-sm text-[#6C6866] ml-1">% per year</span>
              <span className="text-[#A5A5A5] text-xs ml-1">
                ({yearlyAmount} ZEST / year)
              </span>
            </div>

            {/* Interest Rate Slider */}
            <div className="mt-4 relative">
              <InterestSlider
                value={interestRate}
                onValueChange={handleInterestRateChange}
              />
            </div>

            {/* Risk Indicator */}
            <div className="flex items-center mt-4">
              <div
                className={`w-2 h-2 rounded-full mr-1 ${
                  riskLevel === "high"
                    ? "bg-[#F3533E]"
                    : riskLevel === "medium"
                    ? "bg-[#F8B312]"
                    : "bg-[#6AE084]"
                }`}
              ></div>
              <span className="text-[#4A4A4A] font-medium text-xs">
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}{" "}
                redemption risk
              </span>
            </div>
          </div>

          {/* Estimate Fee */}
          <div className="flex justify-between items-center">
            <div className="text-[#827A77] text-sm">Estimated fee</div>
            <div className="text-[#827A77]">$0.06</div>
          </div>

          {/* Mint Button */}
          <Button
            className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-white rounded-sm cursor-pointer"
            onClick={handleMint}
            disabled={isProcessing || isPending}
          >
            {isProcessing || isPending ? "Processing..." : "Mint"}
          </Button>
        </div>
      </div>
    </div>
  );
}
