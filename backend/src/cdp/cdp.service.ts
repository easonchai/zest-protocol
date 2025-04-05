import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateCDPDto, UpdateCDPDto } from './dto/cdp.dto';

@Injectable()
export class CDPService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  async create(createCDPDto: CreateCDPDto) {
    // First interact with blockchain
    const tx = await this.blockchain.createCDP(
      createCDPDto.collateral,
      createCDPDto.debt,
      createCDPDto.interestRate,
    );

    // Then store in database
    return this.prisma.cDP.create({
      data: {
        owner: createCDPDto.owner,
        collateral: createCDPDto.collateral,
        debt: createCDPDto.debt,
        interestRate: createCDPDto.interestRate,
      },
    });
  }

  async findByOwner(owner: string) {
    return this.prisma.cDP.findFirst({
      where: { owner },
    });
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
}
