import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { StakingService } from './staking.service';
import { CreateStakeDto } from './dto/staking.dto';

@ApiTags('Staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare a new stake transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the prepared transaction data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        staker: {
          type: 'string',
          description: 'The Ethereum address of the staker',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        amount: {
          type: 'number',
          description: 'Amount of ZEST to stake',
          example: 1000,
        },
      },
      required: ['staker', 'amount'],
    },
  })
  prepareStake(@Body() createStakeDto: CreateStakeDto) {
    return this.stakingService.prepareStake(createStakeDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed stake transaction' })
  @ApiResponse({ status: 201, description: 'Stake recorded successfully.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        staker: {
          type: 'string',
          description: 'The Ethereum address of the staker',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        amount: {
          type: 'number',
          description: 'Amount of ZEST staked',
          example: 1000,
        },
      },
      required: ['staker', 'amount'],
    },
  })
  @ApiQuery({
    name: 'txHash',
    description: 'The transaction hash of the stake',
    example: '0x123...',
  })
  async recordStake(
    @Body() createStakeDto: CreateStakeDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.stakingService.recordStake(createStakeDto, txHash);
  }

  @Get(':staker')
  @ApiOperation({ summary: 'Get stake by staker address' })
  @ApiResponse({ status: 200, description: 'Returns the stake details.' })
  @ApiParam({
    name: 'staker',
    description: 'The Ethereum address of the staker',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getStake(@Param('staker') staker: string) {
    return await this.stakingService.findByStaker(staker);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stakes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of stakes.' })
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
  async getAllStakes(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.stakingService.findAll(page, limit);
  }

  @Get(':staker/reward')
  @ApiOperation({ summary: 'Calculate staking reward' })
  @ApiResponse({ status: 200, description: 'Returns the calculated reward.' })
  @ApiParam({
    name: 'staker',
    description: 'The Ethereum address of the staker',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async calculateReward(@Param('staker') staker: string) {
    return await this.stakingService.calculateReward(staker);
  }
}
