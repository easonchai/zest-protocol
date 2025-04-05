import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('address/:address')
  @ApiOperation({ summary: 'Get transactions by address' })
  @ApiResponse({
    status: 200,
    description: 'Returns transactions for the address.',
  })
  getTransactionsByAddress(@Param('address') address: string) {
    return this.transactionService.findByAddress(address);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get transactions by type' })
  @ApiResponse({
    status: 200,
    description: 'Returns transactions of the specified type.',
  })
  getTransactionsByType(@Param('type') type: string) {
    return this.transactionService.findByType(type);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of transactions.' })
  async getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionService.findAll(page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Returns transaction statistics.' })
  async getStats() {
    return this.transactionService.getStats();
  }
}
