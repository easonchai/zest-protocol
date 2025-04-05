import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CDPModule } from './cdp/cdp.module';
import { StabilityPoolModule } from './stability-pool/stability-pool.module';
import { SwapModule } from './swap/swap.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PriceFeedModule } from './price-feed/price-feed.module';
import { TransactionModule } from './transaction/transaction.module';
import { ENSModule } from './ens/ens.module';
import { PaymentModule } from './payment/payment.module';
import { KYCModule } from './kyc/kyc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    BlockchainModule,
    PriceFeedModule,
    CDPModule,
    StabilityPoolModule,
    SwapModule,
    TransactionModule,
    PaymentModule,
    KYCModule,
    ENSModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
