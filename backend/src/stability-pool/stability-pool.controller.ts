import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  prepareDeposit(@Body() createDepositDto: CreateStabilityDepositDto) {
    return this.stabilityPoolService.prepareDeposit(createDepositDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed deposit transaction' })
  @ApiResponse({ status: 201, description: 'Deposit recorded successfully.' })
  recordDeposit(
    @Body() createDepositDto: CreateStabilityDepositDto,
    @Query('txHash') txHash: string,
  ) {
    return this.stabilityPoolService.recordDeposit(createDepositDto, txHash);
  }

  @Get(':depositor')
  @ApiOperation({ summary: 'Get deposit by depositor address' })
  @ApiResponse({ status: 200, description: 'Returns the deposit details.' })
  async getDeposit(@Param('depositor') depositor: string) {
    return this.stabilityPoolService.findByDepositor(depositor);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deposits with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of deposits.' })
  async getAllDeposits(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.stabilityPoolService.findAll(page, limit);
  }

  @Get('total/deposits')
  @ApiOperation({ summary: 'Get total deposits in the stability pool' })
  @ApiResponse({ status: 200, description: 'Returns the total deposits.' })
  async getTotalDeposits() {
    return this.stabilityPoolService.getTotalDeposits();
  }
}
