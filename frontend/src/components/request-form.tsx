"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { BitcoinIcon } from "./btc-token-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Token {
  symbol: "ZEST" | "cBTC";
  name: string;
  icon: React.ComponentType;
}

const tokens: Token[] = [
  { symbol: "ZEST", name: "ZEST", icon: ZestTokenIcon },
  { symbol: "cBTC", name: "cBTC", icon: BitcoinIcon },
];

export function RequestForm() {
  const [amount, setAmount] = useState("0.00");
  const [selectedToken, setSelectedToken] = useState<Token["symbol"]>("ZEST");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleAmountBlur = () => {
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      setAmount(num.toFixed(2));
    }
  };

  const handleTokenChange = (value: Token["symbol"]) => {
    setSelectedToken(value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payment/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          token: selectedToken,
          description: description || "Payment for services",
          expiresIn: 3600,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment request");
      }

      const data = await response.json();
      // Handle successful request (e.g., show QR code)
      console.log("Payment request created:", data);
    } catch (error) {
      console.error("Error creating payment request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SelectedTokenIcon =
    tokens.find((t) => t.symbol === selectedToken)?.icon || ZestTokenIcon;

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Token Selection */}
          <div>
            <div className="text-[#827A77] mb-2 text-sm">Token</div>
            <Select value={selectedToken} onValueChange={handleTokenChange}>
              <SelectTrigger className="w-full bg-[#FBFBFB] border-0 p-3 text-[#2A2A2A] font-medium">
                <div className="flex items-center gap-2">
                  <SelectedTokenIcon />
                  <SelectValue placeholder="Select token" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem
                    key={token.symbol}
                    value={token.symbol}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <token.icon />
                      <span>{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Section */}
          <div className="bg-[#FBFBFB] rounded-sm p-5">
            <div className="text-[#827A77] mb-1 text-sm">Amount</div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
              </div>
              <div className="flex items-start">
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-xl font-extrabold mr-2 text-[#2A2A2A]">
                      {selectedToken}
                    </span>
                    <SelectedTokenIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-[#827A77] mb-2 text-sm">
              Description (Optional)
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment for services"
              className="w-full p-3 bg-[#FBFBFB] rounded-sm text-[#2A2A2A] placeholder-[#A5A5A5] focus:outline-none"
            />
          </div>

          {/* Estimate Fee */}
          <div className="flex justify-between items-center mt-auto pt-40">
            <div className="text-[#827A77] text-base">Estimate fee:</div>
            <div className="text-[#827A77] text-base">$0.06</div>
          </div>

          {/* Create Request Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-6 text-lg font-medium bg-[#CB4118] hover:bg-[#B3401E] text-white rounded-sm"
          >
            {isLoading ? "Creating request..." : "Create request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
