import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
