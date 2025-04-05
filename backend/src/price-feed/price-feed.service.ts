/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class PriceFeedService {
  constructor(
    private configService: ConfigService,
    private blockchain: BlockchainService,
  ) {}

  async getCBTCPrice(): Promise<number> {
    return this.blockchain.getCBTCPrice();
  }

  async getZESTPrice(): Promise<number> {
    // For hackathon, we'll mock this
    if (this.configService.get<boolean>('MOCK_PRICE_FEED')) {
      return 1.0; // $1.00 per ZEST
    }
    return 1.0; // In production, this would come from an oracle
  }

  async getUSDTPrice(): Promise<number> {
    // USDT is pegged to USD
    return 1.0;
  }

  async getAllPrices() {
    const [cbtcPrice, zestPrice, usdtPrice] = await Promise.all([
      this.getCBTCPrice(),
      this.getZESTPrice(),
      this.getUSDTPrice(),
    ]);

    return {
      cBTC: cbtcPrice,
      ZEST: zestPrice,
      USDT: usdtPrice,
      updatedAt: new Date(),
    };
  }
}
