const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function calculateSZESTAmount(amount: string): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/stability-pool/calculate-szest/${amount}`
  );
  if (!response.ok) {
    throw new Error("Failed to calculate sZEST amount");
  }
  return response.text();
}
