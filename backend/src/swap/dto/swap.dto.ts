import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateSwapDto {
  @ApiProperty({
    description: 'The wallet address of the swapper',
    example: '0x1234...',
  })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  fromToken: string;

  @ApiProperty({
    description: 'Token to swap to',
    example: 'ZEST',
    enum: ['USDT', 'ZEST'],
  })
  @IsString()
  @IsNotEmpty()
  toToken: string;
}

export class GetSwapBySwapperDto {
  @IsString()
  @IsNotEmpty()
  swapper: string;
}

export class GetSwapRateDto {
  @IsString()
  @IsNotEmpty()
  fromToken: string;

  @IsString()
  @IsNotEmpty()
  toToken: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

export class SwapPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  swapper?: string;

  @IsOptional()
  @IsString()
  fromToken?: string;

  @IsOptional()
  @IsString()
  toToken?: string;
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
