import { Module } from '@nestjs/common';
import { StabilityPoolController } from './stability-pool.controller';
import { StabilityPoolService } from './stability-pool.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [StabilityPoolController],
  providers: [StabilityPoolService],
  exports: [StabilityPoolService],
})
export class StabilityPoolModule {}
