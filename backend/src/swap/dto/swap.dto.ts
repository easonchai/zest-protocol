import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsIn } from 'class-validator';

export class CreateSwapDto {
  @ApiProperty({
    description: 'The wallet address of the swapper',
    example: '0x1234...',
  })
  @IsString()
  swapper: string;

  @ApiProperty({
    description: 'Amount to swap',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Token to swap from',
    example: 'USDT',
    enum: ['USDT', 'ZEST'],
  })
  @IsString()
  @IsIn(['USDT', 'ZEST'])
  fromToken: string;

  @ApiProperty({
    description: 'Token to swap to',
    example: 'ZEST',
    enum: ['USDT', 'ZEST'],
  })
  @IsString()
  @IsIn(['USDT', 'ZEST'])
  toToken: string;
}

export class SwapResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  swapper: string;

  @ApiProperty()
  fromToken: string;

  @ApiProperty()
  toToken: string;

  @ApiProperty()
  fromAmount: number;

  @ApiProperty()
  toAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
