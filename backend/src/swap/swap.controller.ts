import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SwapService } from './swap.service';
import { CreateSwapDto } from './dto/swap.dto';

@ApiTags('Swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare a new swap transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the prepared transaction data.',
  })
  prepareSwap(@Body() createSwapDto: CreateSwapDto) {
    return this.swapService.prepareSwap(createSwapDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed swap transaction' })
  @ApiResponse({ status: 201, description: 'Swap recorded successfully.' })
  async recordSwap(
    @Body() createSwapDto: CreateSwapDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.swapService.recordSwap(createSwapDto, txHash);
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get swap rate' })
  @ApiResponse({ status: 200, description: 'Returns the swap rate.' })
  async getSwapRate(
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: number,
  ) {
    return this.swapService.getSwapRate(fromToken, toToken, amount);
  }

  @Get(':swapper')
  @ApiOperation({ summary: 'Get swaps by swapper address' })
  @ApiResponse({ status: 200, description: 'Returns the swap history.' })
  async getSwaps(@Param('swapper') swapper: string) {
    return this.swapService.findBySwapper(swapper);
  }

  @Get()
  @ApiOperation({ summary: 'Get all swaps with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of swaps.' })
  async getAllSwaps(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.swapService.findAll(page, limit);
  }
}
