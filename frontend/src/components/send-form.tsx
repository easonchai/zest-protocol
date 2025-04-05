"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { X, QrCode } from "lucide-react";
import { getBalance } from "@/utils/api";

interface Recipient {
  id: string;
  name: string;
}

export function SendForm() {
  const { address } = useAccount();
  const [sendAmount, setSendAmount] = useState("0.00");
  const [inputValue, setInputValue] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [balance, setBalance] = useState("0.00");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      try {
        const balanceData = await getBalance(address);
        setBalance(balanceData.zest);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.00");
      }
    };

    fetchBalance();
  }, [address]);

  // Focus input when recipients change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [recipients]);

  // Update suggested value as user types
  useEffect(() => {
    if (!inputValue) {
      setSuggestedValue("");
      return;
    }

    if (inputValue.endsWith(".zest")) {
      setSuggestedValue("");
      return;
    }

    // Check for partial .zest
    if (inputValue.endsWith(".zes")) {
      setSuggestedValue(inputValue + "t");
    } else if (inputValue.endsWith(".ze")) {
      setSuggestedValue(inputValue + "st");
    } else if (inputValue.endsWith(".z")) {
      setSuggestedValue(inputValue + "est");
    } else if (inputValue.endsWith(".")) {
      setSuggestedValue(inputValue + "zest");
    } else {
      setSuggestedValue(inputValue + ".zest");
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendAmount(e.target.value);
  };

  const handleAmountBlur = () => {
    const num = parseFloat(sendAmount);
    if (!isNaN(num)) {
      setSendAmount(num.toFixed(2));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add recipient on Enter, Tab, or comma
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      addRecipient();
    }

    // Remove last recipient on Backspace if input is empty
    if (e.key === "Backspace" && inputValue === "" && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1].id);
    }
  };

  const addRecipient = () => {
    if (!inputValue.trim()) return;

    // If input doesn't end with .zest, use the suggested value
    const nameToAdd = inputValue.endsWith(".zest")
      ? inputValue.trim()
      : suggestedValue.trim();

    if (nameToAdd && !recipients.some((r) => r.name === nameToAdd)) {
      setRecipients([
        ...recipients,
        { id: Date.now().toString(), name: nameToAdd },
      ]);
      setInputValue("");
      setSuggestedValue("");
    }
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter((recipient) => recipient.id !== id));
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Main Card */}
        <div className="p-6 space-y-6">
          {/* Send To Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-[#827A77] text-lg">Send to</div>
              <button className="text-[#CB4118] flex items-center text-sm font-medium cursor-pointer">
                <QrCode className="w-4 h-4 mr-1" />
                Scan QR
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3 border border-[#E5E5E5] rounded-lg bg-white">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center bg-[#FED5C8] text-[#2A2A2A] px-2 py-1 rounded"
                >
                  <span>{recipient.name}</span>
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="ml-1 text-[#2A2A2A] hover:text-[#CB4118]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="relative flex-1 min-w-[120px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={addRecipient}
                  className="w-full outline-none bg-transparent relative z-10"
                  placeholder={recipients.length === 0 ? "Type a name..." : ""}
                />
                {suggestedValue && (
                  <div className="absolute inset-0 text-[#9CA3AF] pointer-events-none">
                    {suggestedValue}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* You Send Section */}
          <div className="bg-[#FBFBFB] rounded-xl p-5">
            <div className="text-[#827A77] mb-1 text-sm">You send</div>
            <div className="flex justify-between">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={sendAmount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
              </div>
              <div className="flex items-start">
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-xl font-extrabold mr-2 text-[#2A2A2A]">
                      ZEST
                    </span>
                    <ZestTokenIcon />
                  </div>
                  <div className="text-[#A5A5A5] text-sm font-semibold">
                    Bal: {balance}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimate Fee */}
          <div className="flex justify-between items-center mt-auto pt-40">
            <div className="text-[#827A77] text-base">Estimate fee:</div>
            <div className="text-[#827A77] text-base">$0.06</div>
          </div>

          {/* Confirm Button */}
          <Button className="w-full py-6 text-lg font-medium bg-[#CB4118] hover:bg-[#B3401E] text-white rounded-xl">
            Confirm payment
          </Button>
        </div>
      </div>
    </div>
  );
}
