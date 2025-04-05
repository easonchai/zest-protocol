import { Module } from '@nestjs/common';
import { ENSService } from './ens.service';
import { ENSController } from './ens.controller';

@Module({
  controllers: [ENSController],
  providers: [ENSService],
  exports: [ENSService],
})
export class ENSModule {}
