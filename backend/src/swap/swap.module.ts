import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [SwapController],
  providers: [SwapService],
  exports: [SwapService],
})
export class SwapModule {}
