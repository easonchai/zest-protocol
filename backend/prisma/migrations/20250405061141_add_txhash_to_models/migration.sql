/*
  Warnings:

  - A unique constraint covering the columns `[txHash]` on the table `CDP` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[txHash]` on the table `StabilityDeposit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[txHash]` on the table `Stake` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `txHash` to the `CDP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txHash` to the `StabilityDeposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txHash` to the `Stake` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CDP" ADD COLUMN     "txHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StabilityDeposit" ADD COLUMN     "txHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stake" ADD COLUMN     "txHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CDP_txHash_key" ON "CDP"("txHash");

-- CreateIndex
CREATE INDEX "CDP_txHash_idx" ON "CDP"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "StabilityDeposit_txHash_key" ON "StabilityDeposit"("txHash");

-- CreateIndex
CREATE INDEX "StabilityDeposit_txHash_idx" ON "StabilityDeposit"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Stake_txHash_key" ON "Stake"("txHash");

-- CreateIndex
CREATE INDEX "Stake_txHash_idx" ON "Stake"("txHash");
