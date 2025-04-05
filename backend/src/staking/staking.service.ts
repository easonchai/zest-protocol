import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateStakeDto } from './dto/staking.dto';

@Injectable()
export class StakingService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  prepareStake(createStakeDto: CreateStakeDto) {
    const amount = ethers.parseEther(createStakeDto.amount.toString());

    // Prepare transaction data
    const iface = new ethers.Interface(this.blockchain.stakingABI);
    const data = iface.encodeFunctionData('stake', [amount]);

    return {
      to: this.blockchain.stakingContract,
      data,
      value: '0', // No ETH value needed
    };
  }

  async findByStaker(staker: string) {
    const stake = await this.prisma.stake.findFirst({
      where: { staker },
    });

    if (!stake) return null;

    // Get on-chain data
    const onChainStake = await this.blockchain.getStake(staker);

    return {
      ...stake,
      onChainAmount: ethers.formatEther(onChainStake.amount),
      onChainSZestAmount: ethers.formatEther(onChainStake.sZestAmount),
    };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [stakes, total] = await Promise.all([
      this.prisma.stake.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stake.count(),
    ]);

    return {
      stakes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async calculateReward(staker: string) {
    const stake = await this.findByStaker(staker);
    if (!stake) return null;

    const reward = await this.blockchain.calculateStakingReward(staker);
    return {
      stakeId: stake.id,
      reward: Number(ethers.formatEther(reward)),
    };
  }

  recordStake(createStakeDto: CreateStakeDto, txHash: string) {
    return this.prisma.stake.create({
      data: {
        staker: createStakeDto.staker,
        amount: createStakeDto.amount,
        sZestAmount: createStakeDto.amount, // 1:1 ratio for now
        txHash,
      },
    });
  }
}
