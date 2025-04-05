/* eslint-disable @typescript-eslint/no-unused-vars */
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

export async function getBtcPrice(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/price-feed`);
  if (!response.ok) {
    throw new Error("Failed to fetch BTC price");
  }
  const data = await response.json();
  return data.cBTC.toFixed(2);
}

export async function getBalance(address: string): Promise<{
  address: string;
  cbtc: string;
  zest: string;
  usdt: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/payment/balance/${address.toLowerCase()}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch balance");
  }
  const data = await response.json();
  return data;
}

export async function getEnsName(address: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ens/lookup/${address.toLowerCase()}`
    );

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      const data = JSON.parse(text);
      return data.name || null;
    } catch (parseError) {
      // If the response is not JSON, return the text directly
      return text || null;
    }
  } catch (error) {
    console.error("Error fetching ENS name:", error);
    return null;
  }
}

interface PaymentRequestResponse {
  requestId: string;
  qrData: string;
  expiresAt: number;
}

export async function createPaymentRequest(
  amount: string,
  token: "ZEST" | "cBTC",
  fromAddress: string,
  description?: string
): Promise<PaymentRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/payment/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      token,
      fromAddress,
      description: description || "Payment for services",
      expiresIn: 3600,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create payment request");
  }

  return response.json();
}
