"use client";

import type React from "react";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { X, QrCode } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
}

export function SendForm() {
  const [sendAmount, setSendAmount] = useState("230.00");
  const [inputValue, setInputValue] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", name: "luc.zest" },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when recipients change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [recipients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // If user is typing .zest manually, don't auto-append
    if (value.endsWith(".zest")) {
      setInputValue(value);
      return;
    }

    // Remove any existing .zest and append it again
    const baseName = value.replace(/\.zest$/, "");
    setInputValue(baseName ? `${baseName}.zest` : "");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add recipient on Enter, Space, or comma
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      addRecipient();
    }

    // Remove last recipient on Backspace if input is empty
    if (e.key === "Backspace" && inputValue === "" && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1].id);
    }
  };

  const addRecipient = () => {
    if (inputValue.trim() && !inputValue.trim().endsWith(".zest")) {
      return; // Don't add if doesn't end with .zest
    }

    if (
      inputValue.trim() &&
      !recipients.some((r) => r.name === inputValue.trim())
    ) {
      setRecipients([
        ...recipients,
        { id: Date.now().toString(), name: inputValue.trim() },
      ]);
      setInputValue("");
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
              <button className="text-[#CB4118] flex items-center text-sm font-medium">
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
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={addRecipient}
                className="flex-1 min-w-[120px] outline-none bg-transparent"
                placeholder={recipients.length === 0 ? "Type a name..." : ""}
              />
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
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="bg-transparent text-[2.75rem] leading-tight font-bold text-[#2A2A2A] w-40 focus:outline-none"
                />
              </div>
              <div className="flex items-start">
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <span className="text-xl font-semibold mr-2 text-[#2A2A2A]">
                      ZEST
                    </span>
                    <ZestTokenIcon />
                  </div>
                  <div className="text-[#A5A5A5] text-sm">Bal: 1,325</div>
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
