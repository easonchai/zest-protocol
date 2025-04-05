"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  useMemo,
} from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { ZestTokenIcon } from "./zest-token-icon";
import { X, QrCode } from "lucide-react";
import { getBalance, getEnsAddress, preparePayment } from "@/utils/api";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ethers } from "ethers";
import { toast } from "sonner";

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [transferHash, setTransferHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: approvalReceipt, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    });

  const { data: transferReceipt, isSuccess: isTransferSuccess } =
    useWaitForTransactionReceipt({
      hash: transferHash,
    });

  useEffect(() => {
    if (isTransferSuccess && transferReceipt) {
      // Clear all inputs and state
      setSendAmount("0.00");
      setInputValue("");
      setSuggestedValue("");
      setRecipients([]);
      setApprovalHash(undefined);
      setTransferHash(undefined);
      setIsApproving(false);
      setIsSending(false);

      // Show success message
      toast.success("Payment sent successfully!");

      // Refresh balance
      const refreshBalance = async () => {
        try {
          const newBalances = await getBalance(address!);
          setBalance(newBalances.zest);
        } catch (error) {
          console.error("Error updating balance:", error);
        }
      };
      refreshBalance();
    }
  }, [isTransferSuccess, transferReceipt, address]);

  useEffect(() => {
    if (isApprovalSuccess && approvalReceipt && recipients.length > 0) {
      const sendPayment = async () => {
        try {
          setIsSending(true);
          // Resolve ENS address if needed
          const recipientAddress = await getEnsAddress(recipients[0].name);
          if (!recipientAddress) {
            throw new Error("Invalid recipient address");
          }

          writeTransfer({
            address: process.env.NEXT_PUBLIC_ZEST_ADDRESS as `0x${string}`,
            abi: [
              {
                type: "function",
                name: "transfer",
                inputs: [
                  { name: "to", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" },
                ],
                outputs: [{ name: "", type: "bool", internalType: "bool" }],
                stateMutability: "nonpayable",
              },
            ],
            functionName: "transfer",
            args: [
              recipientAddress as `0x${string}`,
              ethers.parseEther(sendAmount),
            ],
          });
        } catch (error) {
          console.error("Error resolving recipient address:", error);
          toast.error("Failed to resolve recipient address");
          setIsSending(false);
          setApprovalHash(undefined);
        }
      };

      sendPayment();
    }
  }, [isApprovalSuccess, approvalReceipt, recipients, sendAmount]);

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
        },
      },
    });

  const { writeContract: writeTransfer, isPending: isSendingPending } =
    useWriteContract({
      mutation: {
        onSuccess: (hash) => {
          setTransferHash(hash);
        },
        onError: (error) => {
          console.error("Error sending payment:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to send payment"
          );
          setIsSending(false);
          setApprovalHash(undefined);
          setTransferHash(undefined);
        },
      },
    });

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

  const handleScan = async (result: string | null) => {
    if (!result) return;

    const paymentData = await preparePayment(result);

    try {
      // Clear existing recipients
      setRecipients([]);

      // Add the scanned address as recipient
      setRecipients([
        {
          id: Date.now().toString(),
          name: paymentData.fromAddress,
        },
      ]);

      setSendAmount(paymentData.amount);

      // Stop scanning
      setIsScanning(false);
      setScanError(null);
    } catch (error) {
      setScanError("Failed to process QR code. Please try again.");
      console.error("Error processing QR code:", error);
    }
  };

  const handleScanError = (error: Error) => {
    setScanError("Failed to scan QR code. Please try again.");
    console.error("QR scan error:", error);
  };

  const handleSend = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (recipients.length === 0) {
      toast.error("Please add a recipient");
      return;
    }

    try {
      setIsApproving(true);

      // Validate send amount
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount to send");
      }

      // Resolve ENS address if needed
      const recipientAddress = await getEnsAddress(recipients[0].name);
      if (!recipientAddress) {
        throw new Error("Invalid recipient address");
      }

      // Request approval first
      writeApprove({
        address: process.env.NEXT_PUBLIC_ZEST_ADDRESS as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "approve",
            inputs: [
              { name: "spender", type: "address", internalType: "address" },
              { name: "amount", type: "uint256", internalType: "uint256" },
            ],
            outputs: [{ name: "", type: "bool", internalType: "bool" }],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "approve",
        args: [
          recipientAddress as `0x${string}`,
          ethers.parseEther(sendAmount),
        ],
      });
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to prepare payment"
      );
      setIsApproving(false);
    }
  };

  const formattedBalance = useMemo(() => {
    if (balance === "0.00") return "0.00";
    return Number(ethers.formatEther(balance)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [balance]);

  if (isScanning) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="text-center text-[#827A77] mb-4">Scan QR Code</div>

            <div className="relative aspect-square">
              <Scanner
                onScan={(result) => {
                  handleScan(JSON.parse(result[0].rawValue).requestId);
                }}
                onError={(error: unknown) => {
                  handleScanError(
                    error instanceof Error ? error : new Error(String(error))
                  );
                }}
                constraints={{ facingMode: "environment" }}
              />
            </div>

            {scanError && (
              <div className="text-red-500 text-center">{scanError}</div>
            )}

            <Button
              onClick={() => setIsScanning(false)}
              className="w-full py-6 text-lg font-medium bg-[#CB4118] hover:bg-[#B3401E] text-white rounded-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Main Card */}
        <div className="p-6 space-y-6">
          {/* Send To Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-[#827A77] text-lg">Send to</div>
              <button
                onClick={() => setIsScanning(true)}
                className="text-[#CB4118] flex items-center text-sm font-medium cursor-pointer"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Scan QR
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3 border border-[#E5E5E5] rounded-sm bg-white">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center bg-[#FED5C8] text-[#2A2A2A] px-2 py-1 rounded-xs"
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
          <div className="bg-[#FBFBFB] rounded-sm p-5">
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
                    Bal: {formattedBalance}
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
          <Button
            className="w-full py-6 text-lg font-medium bg-[#CB4118] hover:bg-[#B3401E] text-white rounded-sm cursor-pointer"
            onClick={handleSend}
            disabled={
              isApproving || isApprovingPending || isSending || isSendingPending
            }
          >
            {isApproving || isApprovingPending
              ? "Approving..."
              : isSending || isSendingPending
              ? "Sending..."
              : "Confirm payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
