-- CreateTable
CREATE TABLE "CDP" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "collateral" DOUBLE PRECISION NOT NULL,
    "debt" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "lastAccrual" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isLiquidated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CDP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StabilityDeposit" (
    "id" TEXT NOT NULL,
    "depositor" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StabilityDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stake" (
    "id" TEXT NOT NULL,
    "staker" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sZestAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolStats" (
    "id" TEXT NOT NULL,
    "totalCollateral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStabilityPool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStaked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cbtcPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CDP_owner_idx" ON "CDP"("owner");

-- CreateIndex
CREATE INDEX "StabilityDeposit_depositor_idx" ON "StabilityDeposit"("depositor");

-- CreateIndex
CREATE INDEX "Stake_staker_idx" ON "Stake"("staker");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_from_to_idx" ON "Transaction"("from", "to");

-- CreateIndex
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");
