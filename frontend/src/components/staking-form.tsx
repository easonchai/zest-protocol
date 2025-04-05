"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { SZestTokenIcon } from "./szest-token-icon";

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState("80.00");
  const APY = 12.5; // 12.5% APY

  const handleMaxClick = () => {
    setStakeAmount("80.00"); // Set to max available amount
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

  // Calculate yearly yield based on stake amount and APY
  const yearlyYield = useMemo(() => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount)) return "0.00";
    return ((amount * APY) / 100).toFixed(2);
  }, [stakeAmount]);

  // Calculate daily yield (yearly yield / 365)
  // const dailyYield = useMemo(() => {
  //   const yearly = parseFloat(yearlyYield);
  //   if (isNaN(yearly)) return "0.00";
  //   return (yearly / 365).toFixed(2);
  // }, [yearlyYield]);

  const sampleYield = useMemo(() => {
    return ((1000 * APY) / 100).toFixed(2);
  }, [APY]);

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
                  className="px-1 py-0.5 text-xs font-medium border border-primary text-primary rounded-xs w-fit mt-1"
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
                    Bal: 1,325
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
                {yearlyYield}
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-gray-500 text-sm text-center mt-0.5 mb-6">
            You get {sampleYield} ZEST per day by staking 1000 ZEST.
          </div>

          {/* Continue Button */}
          <Button className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-white rounded-sm cursor-pointer">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
