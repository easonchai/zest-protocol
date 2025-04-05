import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateStabilityDepositDto {
  @ApiProperty({
    description: 'The wallet address of the depositor',
    example: '0x1234...',
  })
  @IsString()
  depositor: string;

  @ApiProperty({
    description: 'Amount of ZEST to deposit',
    example: 50000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount: number;
}

export class StabilityDepositResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  depositor: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
