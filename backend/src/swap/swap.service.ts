import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateSwapDto, SwapPaginationDto } from './dto/swap.dto';

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
    let data;
    if (createSwapDto.fromToken === 'USDT') {
      data = iface.encodeFunctionData('swapUsdtForZest', [amount]);
    } else {
      data = iface.encodeFunctionData('swapZestForUsdt', [amount]);
    }

    return {
      to: this.blockchain.swapContract,
      data,
      value: '0', // No ETH value needed
    };
  }

  async recordSwap(createSwapDto: any, txHash: string) {
    return this.prisma.transaction.create({
      data: {
        type: 'SWAP',
        from: createSwapDto.swapper,
        to: createSwapDto.toToken,
        amount: createSwapDto.amount,
        txHash,
        status: 'COMPLETED',
      },
    });
  }

  getSwapRate(fromToken: string, toToken: string, amount: number) {
    // Implementation for getting swap rate
    return {
      fromToken,
      toToken,
      amount,
      rate: 1.0, // Mock rate
    };
  }

  async findBySwapper(swapper: string) {
    return this.prisma.transaction.findMany({
      where: {
        type: 'SWAP',
        from: swapper,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(query: SwapPaginationDto) {
    const { page = 1, limit = 10, swapper, fromToken, toToken } = query;
    const skip = (page - 1) * limit;

    const where = {
      type: 'SWAP',
      ...(swapper && { from: swapper }),
      ...(fromToken && { from: fromToken }),
      ...(toToken && { to: toToken }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
