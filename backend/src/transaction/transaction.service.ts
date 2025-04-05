import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionPaginationDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findByAddress(address: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ from: address }, { to: address }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(type: string) {
    return this.prisma.transaction.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(query: TransactionPaginationDto) {
    const { page = 1, limit = 10, address, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(address && {
        OR: [{ from: address }, { to: address }],
      }),
      ...(type && { type }),
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

  async getStats() {
    const [total, byType] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, curr) => {
        acc[curr.type] = curr._count;
        return acc;
      }, {}),
    };
  }
}
