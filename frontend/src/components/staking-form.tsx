"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { SZestTokenIcon } from "./szest-token-icon";
import {
  calculateSZESTAmount,
  getBalance,
  prepareStake,
  recordStake,
} from "@/utils/api";
import { ethers } from "ethers";
import { toast } from "sonner";

export function StakingForm() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [stakeData, setStakeData] = useState<{
    to: string;
    data: string;
  } | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(
    undefined
  );

  const { data: approvalReceipt, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    });

  useEffect(() => {
    if (isApprovalSuccess && approvalReceipt && stakeData) {
      setIsStaking(true);
      writeStake({
        address: stakeData.to as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "deposit",
            inputs: [
              { name: "assets", type: "uint256", internalType: "uint256" },
              { name: "receiver", type: "address", internalType: "address" },
            ],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "deposit",
        args: [ethers.parseEther(stakeAmount), address!],
      });
    }
  }, [isApprovalSuccess, approvalReceipt, stakeData]);

  const { writeContract: writeApprove, isPending: isApprovingPending } =
    useWriteContract({
      mutation: {
        onSuccess: (hash) => {
          toast.success("Approval transaction sent!");
          setApprovalHash(hash);
        },
        onError: (error) => {
          console.error("Error approving:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to approve"
          );
          setIsApproving(false);
          setStakeData(null);
        },
      },
    });

  const { writeContract: writeStake, isPending: isStakingPending } =
    useWriteContract({
      mutation: {
        onSuccess: async (hash) => {
          try {
            await recordStake(
              {
                depositor: address!,
                amount: stakeAmount,
              },
              hash
            );
            toast.success("Successfully staked ZEST!");
            // Refresh balances
            const newBalances = await getBalance(address!);
            setBalance(newBalances.zest);
          } catch (error) {
            console.error("Error recording stake:", error);
            toast.error("Failed to record stake");
          } finally {
            setIsStaking(false);
            setStakeData(null);
          }
        },
        onError: (error) => {
          console.error("Error staking:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to stake"
          );
          setIsStaking(false);
          setStakeData(null);
        },
      },
    });

  const [balance, setBalance] = useState<string>("0.00");
  const [stakeAmount, setStakeAmount] = useState("0.00");
  const [debouncedStakeAmount] = useDebounce(stakeAmount, 500);
  const [szestAmount, setSzestAmount] = useState("0.00");
  const APY = 12.5; // 12.5% APY

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      try {
        const balance = await getBalance(address);
        setBalance(balance.zest);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.00");
      }
    };

    fetchBalance();
  }, [address]);

  useEffect(() => {
    const fetchSzestAmount = async () => {
      if (
        !debouncedStakeAmount ||
        !address ||
        debouncedStakeAmount === "0.00"
      ) {
        setSzestAmount("0.00");
        return;
      }
      setIsStaking(true);
      try {
        const amount = await calculateSZESTAmount(debouncedStakeAmount);
        setSzestAmount(amount);
      } catch (error) {
        console.error("Error calculating sZEST amount:", error);
        setSzestAmount("0.00");
      } finally {
        setIsStaking(false);
      }
    };

    fetchSzestAmount();
  }, [debouncedStakeAmount, address]);

  const handleMaxClick = () => {
    setStakeAmount(Number(ethers.formatEther(balance)).toFixed(2));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
  };

  const handleAmountBlur = () => {
    const num = parseFloat(stakeAmount);
    if (!isNaN(num)) {
      setStakeAmount(num.toFixed(2));
    }
  };

  const dailyYield = useMemo(() => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount)) return "0.00";
    return ((amount * APY) / (100 * 365)).toFixed(2);
  }, [stakeAmount, APY]);

  const formattedBalance = useMemo(() => {
    // Convert from 18 decimals to ether and format to 2 decimal places
    if (balance === "0.00") return "0.00";
    return Number(ethers.formatEther(balance)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [balance]);

  const handleStake = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsApproving(true);

      // Validate stake amount
      const amount = parseFloat(stakeAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount to stake");
      }

      // Prepare stake transaction first to get the correct contract address
      const preparedData = await prepareStake({
        depositor: address,
        amount: stakeAmount,
      });

      // Validate stake data
      if (!preparedData.to || !preparedData.data) {
        throw new Error("Invalid stake data received from server");
      }

      // Store stake data for later use
      setStakeData(preparedData);

      // Request approval first
      writeApprove({
        address: process.env.NEXT_PUBLIC_ZEST_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [preparedData.to, ethers.parseEther(stakeAmount)],
      });
    } catch (error) {
      console.error("Error preparing stake:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to prepare stake"
      );
      setIsApproving(false);
      setStakeData(null);
    }
  };

  if (!address) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6 text-center">
          <p className="text-gray-500">
            Please connect your wallet to stake ZEST
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Main Card */}
        <div className="p-6 space-y-2">
          {/* Stake Amount */}
          <div className="bg-gray-50 rounded-sm p-5">
            <div className="text-gray-500 mb-1 text-sm">You stake</div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
                <button
                  className="px-1 py-0.5 text-xs font-medium border border-[#EBE7E7] text-[#4A4A4A] rounded-xs w-fit mt-1"
                  onClick={handleMaxClick}
                >
                  MAX
                </button>
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
                    Bal: {formattedBalance}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimate Fee */}
          <div className="flex justify-between items-center mb-32">
            <div className="text-gray-500 text-sm">Estimated fee</div>
            <div className="text-gray-500">$0.06</div>
          </div>

          {/* Total Yield */}
          <div className="bg-[#FFF6F3] rounded-sm p-4 flex justify-between items-center mt-8">
            <div>
              <div className="text-gray-600 text-sm font-medium">
                Total yield
              </div>
              <div className="text-sm text-[#F4AA3E] font-bold">
                +{APY}% APY
              </div>
            </div>
            <div className="flex items-center">
              <SZestTokenIcon size="sm" />
              <span className="text-4xl font-bold ml-2 text-[#2A2A2A]">
                {isStaking ? "..." : szestAmount}
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-gray-500 text-sm text-center mt-0.5 mb-6">
            You get {dailyYield} ZEST per day by staking {stakeAmount} ZEST.
          </div>

          {/* Continue Button */}
          <Button
            className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-white rounded-sm cursor-pointer"
            onClick={handleStake}
            disabled={
              isApproving || isApprovingPending || isStaking || isStakingPending
            }
          >
            {isApproving || isApprovingPending
              ? "Approving..."
              : isStaking || isStakingPending
              ? "Staking..."
              : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
