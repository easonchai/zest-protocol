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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'The Ethereum address that will own the CDP',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        collateral: {
          type: 'number',
          description: 'Amount of cBTC to deposit as collateral',
          example: 1.5,
        },
        debt: {
          type: 'number',
          description: 'Amount of ZEST to borrow',
          example: 1000,
        },
        interestRate: {
          type: 'number',
          description: 'Interest rate in basis points per second',
          example: 100,
        },
      },
      required: ['owner', 'collateral', 'debt', 'interestRate'],
    },
  })
  prepareCreateCDP(@Body() createCDPDto: CreateCDPDto) {
    return this.cdpService.prepareCreateCDP(createCDPDto);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed CDP creation' })
  @ApiResponse({ status: 201, description: 'CDP recorded successfully.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'The Ethereum address that owns the CDP',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        collateral: {
          type: 'number',
          description: 'Amount of cBTC deposited as collateral',
          example: 1.5,
        },
        debt: {
          type: 'number',
          description: 'Amount of ZEST borrowed',
          example: 1000,
        },
        interestRate: {
          type: 'number',
          description: 'Interest rate in basis points per second',
          example: 100,
        },
      },
      required: ['owner', 'collateral', 'debt', 'interestRate'],
    },
  })
  @ApiQuery({
    name: 'txHash',
    description: 'The transaction hash of the CDP creation',
    example: '0x123...',
  })
  async recordCDP(
    @Body() createCDPDto: CreateCDPDto,
    @Query('txHash') txHash: string,
  ) {
    return await this.cdpService.recordCDP(createCDPDto, txHash);
  }

  @Get(':owner')
  @ApiOperation({ summary: 'Get CDP by owner address' })
  @ApiResponse({ status: 200, description: 'Returns the CDP details.' })
  @ApiParam({
    name: 'owner',
    description: 'The Ethereum address of the CDP owner',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getCDP(@Param('owner') owner: string) {
    return await this.cdpService.findByOwner(owner);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CDPs with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of CDPs.' })
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
  async getAllCDPs(@Query('page') page = 1, @Query('limit') limit = 10) {
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
