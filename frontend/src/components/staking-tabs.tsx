"use client";

import { cn } from "@/lib/utils";

interface StakingTabsProps {
  activeTab: "stake" | "unstake";
  onTabChange: (tab: "stake" | "unstake") => void;
}

export function StakingTabs({ activeTab, onTabChange }: StakingTabsProps) {
  return (
    <div className="flex space-x-4 mb-6 max-w-md mx-auto px-4">
      <button
        className={cn(
          "flex-1 py-3 px-6 font-medium rounded-[3px] border text-sm",
          activeTab === "stake"
            ? "bg-[#FFF5F2] text-primary border-primary"
            : "border-transparent text-gray-500 hover:text-gray-700"
        )}
        onClick={() => onTabChange("stake")}
      >
        Stake
        <span className="ml-2 text-primary text-xs">+12.5 APY</span>
      </button>
      <button
        className={cn(
          "flex-1 py-3 px-6 text-sm font-medium rounded-[3px] border",
          activeTab === "unstake"
            ? "bg-[#FFF5F2] text-primary border-primary"
            : "border-transparent text-gray-500 hover:text-gray-700"
        )}
        onClick={() => onTabChange("unstake")}
      >
        Unstake
      </button>
    </div>
  );
}
