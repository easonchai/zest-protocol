import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PriceFeedService } from './price-feed.service';

@ApiTags('Price Feed')
@Controller('price-feed')
export class PriceFeedController {
  constructor(private readonly priceFeedService: PriceFeedService) {}

  @Get('cbtc')
  @ApiOperation({ summary: 'Get cBTC price' })
  @ApiResponse({ status: 200, description: 'Returns the cBTC price in USD.' })
  async getCBTCPrice() {
    return this.priceFeedService.getCBTCPrice();
  }

  @Get('zest')
  @ApiOperation({ summary: 'Get ZEST price' })
  @ApiResponse({ status: 200, description: 'Returns the ZEST price in USD.' })
  async getZESTPrice() {
    return this.priceFeedService.getZESTPrice();
  }

  @Get('usdt')
  @ApiOperation({ summary: 'Get USDT price' })
  @ApiResponse({ status: 200, description: 'Returns the USDT price in USD.' })
  async getUSDTPrice() {
    return this.priceFeedService.getUSDTPrice();
  }

  @Get()
  @ApiOperation({ summary: 'Get all prices' })
  @ApiResponse({ status: 200, description: 'Returns all token prices.' })
  async getAllPrices() {
    return this.priceFeedService.getAllPrices();
  }
}
