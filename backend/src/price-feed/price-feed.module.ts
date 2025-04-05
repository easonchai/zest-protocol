import { Module } from '@nestjs/common';
import { PriceFeedController } from './price-feed.controller';
import { PriceFeedService } from './price-feed.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [PriceFeedController],
  providers: [PriceFeedService],
  exports: [PriceFeedService],
})
export class PriceFeedModule {}
