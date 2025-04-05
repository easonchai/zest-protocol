import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ENSService } from './ens.service';
import { ENSController } from './ens.controller';
import { ENSProcessor } from './ens.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'ens',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [ENSController],
  providers: [ENSService, ENSProcessor],
  exports: [ENSService],
})
export class ENSModule {}
