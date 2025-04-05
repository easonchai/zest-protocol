import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateStabilityDepositDto } from './dto/stability-pool.dto';

@Injectable()
export class StabilityPoolService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  prepareDeposit(createDepositDto: CreateStabilityDepositDto) {
    const amount = ethers.parseEther(createDepositDto.amount.toString());

    // Prepare transaction data
    const iface = new ethers.Interface(this.blockchain.stabilityPoolABI);
    const data = iface.encodeFunctionData('deposit', [
      amount,
      createDepositDto.depositor,
    ]);

    return {
      to: this.blockchain.stabilityPoolContract,
      data,
      value: '0', // No ETH value needed
    };
  }

  prepareWithdraw(amount: string, receiver: string, owner: string) {
    const withdrawAmount = ethers.parseEther(amount);

    // Prepare transaction data
    const iface = new ethers.Interface(this.blockchain.stabilityPoolABI);
    const data = iface.encodeFunctionData('withdraw', [
      withdrawAmount,
      receiver,
      owner,
    ]);

    return {
      to: this.blockchain.stabilityPoolContract,
      data,
      value: '0',
    };
  }

  async findByDepositor(depositor: string) {
    const deposit = await this.prisma.stabilityDeposit.findFirst({
      where: { depositor },
    });

    if (!deposit) return null;

    // Get on-chain data
    const [onChainDeposit, yield_] = await Promise.all([
      this.blockchain.getStabilityPoolDeposit(depositor),
      this.blockchain.getStabilityPoolYield(depositor),
    ]);

    return {
      ...deposit,
      onChainAmount: ethers.formatEther(onChainDeposit.amount),
      yield: ethers.formatEther(yield_),
      lastYieldUpdate: new Date(Number(onChainDeposit.lastYieldUpdate) * 1000),
    };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [deposits, total] = await Promise.all([
      this.prisma.stabilityDeposit.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stabilityDeposit.count(),
    ]);

    return {
      deposits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTotalDeposits() {
    const total = await this.blockchain.getTotalStabilityPoolDeposits();
    return ethers.formatEther(total);
  }

  async getTotalYield() {
    const total = await this.blockchain.getTotalStabilityPoolYield();
    return ethers.formatEther(total);
  }

  async getSharePrice() {
    const sharePrice = await this.blockchain.getStabilityPoolSharePrice();
    return ethers.formatEther(sharePrice);
  }

  async calculateSZESTAmount(zestAmount: string) {
    const sharePrice = await this.blockchain.getStabilityPoolSharePrice();
    const amount = ethers.parseEther(zestAmount);
    const sZESTAmount = (amount * BigInt(1e18)) / BigInt(sharePrice);
    return ethers.formatEther(sZESTAmount);
  }

  recordDeposit(createDepositDto: CreateStabilityDepositDto, txHash: string) {
    return this.prisma.stabilityDeposit.create({
      data: {
        depositor: createDepositDto.depositor,
        amount: createDepositDto.amount,
        txHash,
      },
    });
  }
}
