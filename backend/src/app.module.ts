import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CDPModule } from './cdp/cdp.module';
import { StabilityPoolModule } from './stability-pool/stability-pool.module';
import { StakingModule } from './staking/staking.module';
import { SwapModule } from './swap/swap.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PriceFeedModule } from './price-feed/price-feed.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    BlockchainModule,
    PriceFeedModule,
    CDPModule,
    StabilityPoolModule,
    StakingModule,
    SwapModule,
    TransactionModule,
  ],
})
export class AppModule {}
