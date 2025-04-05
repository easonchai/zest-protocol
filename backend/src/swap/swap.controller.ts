import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SwapService } from './swap.service';
import {
  CreateSwapDto,
  GetSwapBySwapperDto,
  GetSwapRateDto,
  SwapPaginationDto,
} from './dto/swap.dto';

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
  @ApiBody({ type: CreateSwapDto })
  prepareSwap(@Body(ValidationPipe) createSwapDto: CreateSwapDto) {
    return this.swapService.prepareSwap(createSwapDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed swap transaction' })
  @ApiResponse({ status: 201, description: 'Swap recorded successfully.' })
  @ApiBody({ type: CreateSwapDto })
  @ApiQuery({
    name: 'txHash',
    description: 'The transaction hash of the swap',
    example: '0x123...',
  })
  async recordSwap(
    @Body(ValidationPipe) createSwapDto: CreateSwapDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.swapService.recordSwap(createSwapDto, txHash);
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get swap rate' })
  @ApiResponse({ status: 200, description: 'Returns the swap rate.' })
  getSwapRate(@Query(ValidationPipe) query: GetSwapRateDto) {
    return this.swapService.getSwapRate(
      query.fromToken,
      query.toToken,
      query.amount,
    );
  }

  @Get(':swapper')
  @ApiOperation({ summary: 'Get swaps by swapper address' })
  @ApiResponse({ status: 200, description: 'Returns the swap history.' })
  @ApiParam({
    name: 'swapper',
    description: 'The Ethereum address of the swapper',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getSwaps(@Param(ValidationPipe) params: GetSwapBySwapperDto) {
    return this.swapService.findBySwapper(params.swapper);
  }

  @Get()
  @ApiOperation({ summary: 'Get all swaps with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of swaps.' })
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
  @ApiQuery({
    name: 'swapper',
    description: 'Filter by swapper address',
    required: false,
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  @ApiQuery({
    name: 'fromToken',
    description: 'Filter by from token',
    required: false,
    example: 'USDT',
  })
  @ApiQuery({
    name: 'toToken',
    description: 'Filter by to token',
    required: false,
    example: 'ZEST',
  })
  async getAllSwaps(@Query(ValidationPipe) query: SwapPaginationDto) {
    return this.swapService.findAll(query);
  }
}
