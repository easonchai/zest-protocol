import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  prepareStake(@Body() createStakeDto: CreateStakeDto) {
    return this.stakingService.prepareStake(createStakeDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed stake transaction' })
  @ApiResponse({ status: 201, description: 'Stake recorded successfully.' })
  async recordStake(
    @Body() createStakeDto: CreateStakeDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.stakingService.recordStake(createStakeDto, txHash);
  }

  @Get(':staker')
  @ApiOperation({ summary: 'Get stake by staker address' })
  @ApiResponse({ status: 200, description: 'Returns the stake details.' })
  async getStake(@Param('staker') staker: string) {
    return await this.stakingService.findByStaker(staker);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stakes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of stakes.' })
  async getAllStakes(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.stakingService.findAll(page, limit);
  }

  @Get(':staker/reward')
  @ApiOperation({ summary: 'Calculate staking reward' })
  @ApiResponse({ status: 200, description: 'Returns the calculated reward.' })
  async calculateReward(@Param('staker') staker: string) {
    return await this.stakingService.calculateReward(staker);
  }
}
