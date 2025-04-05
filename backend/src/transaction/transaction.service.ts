import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  findByAddress(address: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ from: address }, { to: address }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByType(type: string) {
    return this.prisma.transaction.findMany({
      where: { type },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count(),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [totalTransactions, uniqueUsers] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.findMany({
        select: {
          from: true,
        },
        distinct: ['from'],
      }),
    ]);

    return {
      totalTransactions,
      uniqueUsers: uniqueUsers.length,
      updatedAt: new Date(),
    };
  }
}
