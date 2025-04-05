import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateSwapDto } from './dto/swap.dto';

@Injectable()
export class SwapService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  prepareSwap(createSwapDto: CreateSwapDto) {
    const amount = ethers.parseEther(createSwapDto.amount.toString());

    // Prepare transaction data
    const iface = new ethers.Interface(this.blockchain.swapABI);
    const data = iface.encodeFunctionData('swapTokens', [
      createSwapDto.fromToken,
      createSwapDto.toToken,
      amount,
    ]);

    return {
      to: this.blockchain.swapContract,
      data,
      value: '0', // No ETH value needed
    };
  }

  async getSwapRate(fromToken: string, toToken: string, amount: number) {
    const outputAmount = await this.blockchain.getSwapOutputAmount(
      fromToken,
      toToken,
      ethers.parseEther(amount.toString()),
    );

    return {
      fromToken,
      toToken,
      inputAmount: amount,
      outputAmount: Number(ethers.formatEther(outputAmount)),
      rate: Number(ethers.formatEther(outputAmount)) / amount,
    };
  }

  async findBySwapper(swapper: string) {
    const swaps = await this.prisma.transaction.findMany({
      where: {
        from: swapper,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return swaps;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [swaps, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          type: 'SWAP',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({
        where: {
          type: 'SWAP',
        },
      }),
    ]);

    return {
      swaps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  recordSwap(createSwapDto: CreateSwapDto, txHash: string) {
    return this.prisma.transaction.create({
      data: {
        type: 'SWAP',
        from: createSwapDto.swapper,
        amount: createSwapDto.amount,
        status: 'COMPLETED',
        txHash,
      },
    });
  }
}
