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

export interface PaymentData {
  to: string;
  value: string;
  data: string;
  token: string;
  amount: string;
  description: string | null;
  fromAddress: string;
  requestId: string;
}

export async function preparePayment(requestId: string): Promise<PaymentData> {
  const response = await fetch(`${API_BASE_URL}/payment/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    throw new Error("Failed to prepare payment");
  }

  return response.json();
}

export interface CDPData {
  to: string;
  data: string;
  value: string;
  collateral: string;
  debt: string;
  interestRate: number;
}

export interface CreateCDPDto {
  owner: string;
  collateral: string;
  debt: string;
  interestRate: number;
}

export async function prepareCDP(dto: CreateCDPDto): Promise<CDPData> {
  const response = await fetch(`${API_BASE_URL}/cdp/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error("Failed to prepare CDP");
  }

  return response.json();
}

export async function recordCDP(
  dto: CreateCDPDto,
  txHash: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cdp/record?txHash=${txHash}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error("Failed to record CDP");
  }
}

export async function checkCDPExists(address: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cdp/owner/${address.toLowerCase()}`
    );
    if (!response.ok) {
      throw new Error("Failed to check CDP existence");
    }
    const data = await response.json();
    return data.collateral > 0; // If collateral is greater than 0, CDP exists
  } catch (error) {
    console.error("Error checking CDP existence:", error);
    return false;
  }
}

export async function prepareStake(createStakeDto: {
  depositor: string;
  amount: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/stability-pool/prepare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createStakeDto),
    });
    if (!response.ok) {
      throw new Error("Failed to prepare stake");
    }
    return response.json();
  } catch (error) {
    console.error("Error preparing stake:", error);
    throw error;
  }
}

export async function recordStake(
  createStakeDto: { depositor: string; amount: string },
  txHash: string
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stability-pool/record?txHash=${txHash}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createStakeDto),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to record stake");
    }
    return response.json();
  } catch (error) {
    console.error("Error recording stake:", error);
    throw error;
  }
}
