import { ethers } from "ethers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function calculateSZESTAmount(amount: string): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/stability-pool/calculate-szest/${amount}`
  );
  if (!response.ok) {
    throw new Error("Failed to calculate sZEST amount");
  }
  const rawAmount = await response.text();
  // Remove any decimal points and convert to BigInt string
  const bigIntAmount = rawAmount.split(".")[0];
  // Format from 18 decimals to 2 decimal places
  return Number(ethers.formatEther(bigIntAmount)).toFixed(2);
}
