import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        swapper: {
          type: 'string',
          description: 'The Ethereum address of the swapper',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        fromToken: {
          type: 'string',
          description: 'The token address to swap from',
          example: '0x123...',
        },
        toToken: {
          type: 'string',
          description: 'The token address to swap to',
          example: '0x456...',
        },
        amount: {
          type: 'number',
          description: 'Amount of tokens to swap',
          example: 100,
        },
      },
      required: ['swapper', 'fromToken', 'toToken', 'amount'],
    },
  })
  prepareSwap(@Body() createSwapDto: CreateSwapDto) {
    return this.swapService.prepareSwap(createSwapDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed swap transaction' })
  @ApiResponse({ status: 201, description: 'Swap recorded successfully.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        swapper: {
          type: 'string',
          description: 'The Ethereum address of the swapper',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        fromToken: {
          type: 'string',
          description: 'The token address swapped from',
          example: '0x123...',
        },
        toToken: {
          type: 'string',
          description: 'The token address swapped to',
          example: '0x456...',
        },
        amount: {
          type: 'number',
          description: 'Amount of tokens swapped',
          example: 100,
        },
      },
      required: ['swapper', 'fromToken', 'toToken', 'amount'],
    },
  })
  @ApiQuery({
    name: 'txHash',
    description: 'The transaction hash of the swap',
    example: '0x123...',
  })
  async recordSwap(
    @Body() createSwapDto: CreateSwapDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.swapService.recordSwap(createSwapDto, txHash);
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get swap rate' })
  @ApiResponse({ status: 200, description: 'Returns the swap rate.' })
  @ApiQuery({
    name: 'fromToken',
    description: 'The token address to swap from',
    example: '0x123...',
  })
  @ApiQuery({
    name: 'toToken',
    description: 'The token address to swap to',
    example: '0x456...',
  })
  @ApiQuery({
    name: 'amount',
    description: 'Amount of tokens to swap',
    example: 100,
  })
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
  @ApiParam({
    name: 'swapper',
    description: 'The Ethereum address of the swapper',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getSwaps(@Param('swapper') swapper: string) {
    return this.swapService.findBySwapper(swapper);
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
  async getAllSwaps(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.swapService.findAll(page, limit);
  }
}
