import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CDPService } from './cdp.service';
import { CreateCDPDto } from './dto/cdp.dto';

@ApiTags('CDP')
@Controller('cdp')
export class CDPController {
  constructor(private readonly cdpService: CDPService) {}

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare a new CDP transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the prepared transaction data.',
  })
  prepareCreateCDP(@Body() createCDPDto: CreateCDPDto) {
    return this.cdpService.prepareCreateCDP(createCDPDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed CDP creation' })
  @ApiResponse({ status: 201, description: 'CDP recorded successfully.' })
  async recordCDP(
    @Body() createCDPDto: CreateCDPDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.cdpService.recordCDP(createCDPDto, txHash);
  }

  @Get(':owner')
  @ApiOperation({ summary: 'Get CDP by owner address' })
  @ApiResponse({ status: 200, description: 'Returns the CDP details.' })
  async getCDP(@Param('owner') owner: string) {
    return await this.cdpService.findByOwner(owner);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CDPs with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of CDPs.' })
  async getAllCDPs(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.cdpService.findAll(page, limit);
  }

  @Get(':owner/interest')
  @ApiOperation({ summary: 'Calculate accrued interest for a CDP' })
  @ApiResponse({ status: 200, description: 'Returns the accrued interest.' })
  async getAccruedInterest(@Param('owner') owner: string) {
    return await this.cdpService.calculateInterest(owner);
  }
}
