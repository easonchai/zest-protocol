"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState("80.00");

  const handleMaxClick = () => {
    setStakeAmount("80.00"); // Set to max available amount
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Main Card */}
        <div className="p-6 space-y-6">
          {/* Stake Amount */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="text-gray-500 mb-1 text-sm">You stake</div>
            <div className="flex justify-between">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
                <button
                  className="px-2 py-1 text-xs font-medium border border-primary text-primary rounded w-fit mt-1"
                  onClick={handleMaxClick}
                >
                  MAX
                </button>
              </div>
              <div className="flex items-start">
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-xl font-semibold mr-2 text-[#2A2A2A]">
                      ZEST
                    </span>
                    <ZestTokenIcon />
                  </div>
                  <div className="text-gray-400 text-sm">Bal: 1,325</div>
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
          <div className="bg-[#FFF5F2] rounded-xl p-4 flex justify-between items-center mt-8">
            <div>
              <div className="text-gray-600 text-sm">Total yield</div>
              <div className="text-primary text-sm">+12.5 APY</div>
            </div>
            <div className="flex items-center">
              <ZestTokenIcon size="sm" />
              <span className="text-4xl font-bold ml-2 text-[#2A2A2A]">
                78.00
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-gray-500 text-sm text-center">
            You get 25 sZEST per day by staking 1000 ZEST.
          </div>

          {/* Continue Button */}
          <Button className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 text-white rounded-xl">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
