import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateCDPDto } from './dto/cdp.dto';

@Injectable()
export class CDPService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  prepareCreateCDP(createCDPDto: CreateCDPDto) {
    const collateral = ethers.parseEther(createCDPDto.collateral.toString());
    const debt = ethers.parseEther(createCDPDto.debt.toString());

    // Prepare transaction data
    const iface = new ethers.Interface(this.blockchain.cdpManagerABI);
    const data = iface.encodeFunctionData('openCDP', [
      collateral,
      debt,
      createCDPDto.interestRate,
    ]);

    return {
      to: this.blockchain.cdpManagerContract,
      data,
      value: collateral.toString(),
    };
  }

  async findByOwner(owner: string) {
    const cdp = await this.prisma.cDP.findFirst({
      where: { owner },
    });

    if (!cdp) return null;

    // Get on-chain data
    const onChainCDP = await this.blockchain.getCDPDetails(owner);

    return {
      ...cdp,
      onChainCollateral: ethers.formatEther(onChainCDP.collateral),
      onChainDebt: ethers.formatEther(onChainCDP.debt),
    };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [cdps, total] = await Promise.all([
      this.prisma.cDP.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cDP.count(),
    ]);

    return {
      cdps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async calculateInterest(owner: string) {
    const cdp = await this.findByOwner(owner);
    if (!cdp) return null;

    const now = new Date();
    const timePassed = Math.floor(
      (now.getTime() - cdp.lastAccrual.getTime()) / 1000,
    );
    const interest = (cdp.debt * cdp.interestRate * timePassed) / 10000;

    return {
      cdpId: cdp.id,
      accruedInterest: interest,
      timePassed,
      currentDebt: cdp.debt + interest,
    };
  }

  recordCDP(createCDPDto: CreateCDPDto, txHash: string) {
    return this.prisma.cDP.create({
      data: {
        owner: createCDPDto.owner,
        collateral: Number(createCDPDto.collateral),
        debt: Number(createCDPDto.debt),
        interestRate: Number(createCDPDto.interestRate),
        txHash,
      },
    });
  }
}
