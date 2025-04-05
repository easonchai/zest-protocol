import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateCDPDto {
  @ApiProperty({
    description: 'The wallet address of the CDP owner',
    example: '0x1234...',
  })
  @IsString()
  owner: string;

  @ApiProperty({
    description: 'Amount of cBTC to deposit as collateral',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  collateral: number;

  @ApiProperty({
    description: 'Amount of ZEST to mint',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  debt: number;

  @ApiProperty({
    description: 'Interest rate in basis points per second',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  interestRate: number;
}

export class UpdateCDPDto {
  @ApiProperty({
    description: 'Additional amount of cBTC to deposit as collateral',
    example: 0.5,
  })
  @IsNumber()
  @Min(0)
  additionalCollateral?: number;

  @ApiProperty({
    description: 'Additional amount of ZEST to mint',
    example: 10000,
  })
  @IsNumber()
  @Min(0)
  additionalDebt?: number;
}

export class CDPResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  collateral: number;

  @ApiProperty()
  debt: number;

  @ApiProperty()
  interestRate: number;

  @ApiProperty()
  lastAccrual: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isLiquidated: boolean;
}
