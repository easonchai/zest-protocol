import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiParam({
    name: 'address',
    description: 'The Ethereum address to get transactions for',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getTransactionsByAddress(@Param('address') address: string) {
    return await this.transactionService.findByAddress(address);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get transactions by type' })
  @ApiResponse({
    status: 200,
    description: 'Returns transactions of the specified type.',
  })
  @ApiParam({
    name: 'type',
    description: 'The type of transactions to retrieve',
    example: 'SWAP',
    enum: ['SWAP', 'STAKE', 'CDP', 'STABILITY_DEPOSIT', 'ENS_REGISTER'],
  })
  async getTransactionsByType(@Param('type') type: string) {
    return await this.transactionService.findByType(type);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of transactions.' })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  async getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return await this.transactionService.findAll(page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Returns transaction statistics.' })
  async getStats() {
    return await this.transactionService.getStats();
  }
}
