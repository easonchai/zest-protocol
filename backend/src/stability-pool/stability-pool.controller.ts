import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { StabilityPoolService } from './stability-pool.service';
import { CreateStabilityDepositDto } from './dto/stability-pool.dto';

@ApiTags('Stability Pool')
@Controller('stability-pool')
export class StabilityPoolController {
  constructor(private readonly stabilityPoolService: StabilityPoolService) {}

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare a new stability pool deposit transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns transaction data for frontend to execute.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        depositor: {
          type: 'string',
          description: 'The Ethereum address of the depositor',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        amount: {
          type: 'number',
          description: 'Amount of ZEST to deposit',
          example: 1000,
        },
      },
      required: ['depositor', 'amount'],
    },
  })
  prepareDeposit(@Body() createDepositDto: CreateStabilityDepositDto) {
    return this.stabilityPoolService.prepareDeposit(createDepositDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed deposit transaction' })
  @ApiResponse({ status: 201, description: 'Deposit recorded successfully.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        depositor: {
          type: 'string',
          description: 'The Ethereum address of the depositor',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        amount: {
          type: 'number',
          description: 'Amount of ZEST deposited',
          example: 1000,
        },
      },
      required: ['depositor', 'amount'],
    },
  })
  @ApiQuery({
    name: 'txHash',
    description: 'The transaction hash of the deposit',
    example: '0x123...',
  })
  async recordDeposit(
    @Body() createDepositDto: CreateStabilityDepositDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.stabilityPoolService.recordDeposit(
      createDepositDto,
      txHash,
    );
  }

  @Get(':depositor')
  @ApiOperation({ summary: 'Get deposit by depositor address' })
  @ApiResponse({ status: 200, description: 'Returns the deposit details.' })
  @ApiParam({
    name: 'depositor',
    description: 'The Ethereum address of the depositor',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getDeposit(@Param('depositor') depositor: string) {
    return await this.stabilityPoolService.findByDepositor(depositor);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deposits with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of deposits.' })
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
  async getAllDeposits(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.stabilityPoolService.findAll(page, limit);
  }

  @Get('total/deposits')
  @ApiOperation({ summary: 'Get total deposits in the stability pool' })
  @ApiResponse({ status: 200, description: 'Returns the total deposits.' })
  async getTotalDeposits() {
    return await this.stabilityPoolService.getTotalDeposits();
  }
}
