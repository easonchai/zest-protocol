import { Module } from '@nestjs/common';
import { CDPController } from './cdp.controller';
import { CDPService } from './cdp.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [CDPController],
  providers: [CDPService],
  exports: [CDPService],
})
export class CDPModule {}
