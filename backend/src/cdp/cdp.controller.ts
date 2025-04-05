import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CDPService } from './cdp.service';
import { CreateCDPDto, GetCDPDto, CDPPaginationDto } from './dto/cdp.dto';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('CDP')
@Controller('cdp')
export class CDPController {
  constructor(private readonly cdpService: CDPService) {}

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare CDP creation transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the prepared transaction data.',
  })
  @ApiBody({ type: CreateCDPDto })
  prepareCreateCDP(@Body(new ValidationPipe()) createCDPDto: CreateCDPDto) {
    return this.cdpService.prepareCreateCDP(createCDPDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a created CDP' })
  @ApiResponse({
    status: 200,
    description: 'CDP recorded successfully.',
  })
  @ApiBody({ type: CreateCDPDto })
  @ApiQuery({
    name: 'txHash',
    description: 'Transaction hash of the CDP creation',
    example: '0x123...',
  })
  async recordCDP(
    @Body(new ValidationPipe()) createCDPDto: CreateCDPDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.cdpService.recordCDP(createCDPDto, txHash);
  }

  @Get('owner/:owner')
  @ApiOperation({ summary: 'Get CDP by owner' })
  @ApiResponse({
    status: 200,
    description: 'Returns the CDP details.',
  })
  @ApiParam({
    name: 'owner',
    description: 'Owner address',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getCDP(@Param(new ValidationPipe()) params: GetCDPDto) {
    return await this.cdpService.findByOwner(params.owner);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CDPs with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of CDPs.' })
  async getAllCDPs(@Query(new ValidationPipe()) query: CDPPaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return await this.cdpService.findAll(page, limit);
  }

  @Get(':owner/interest')
  @ApiOperation({ summary: 'Calculate accrued interest for a CDP' })
  @ApiResponse({ status: 200, description: 'Returns the accrued interest.' })
  @ApiParam({
    name: 'owner',
    description: 'The Ethereum address of the CDP owner',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getAccruedInterest(@Param('owner') owner: string) {
    return await this.cdpService.calculateInterest(owner);
  }
}
