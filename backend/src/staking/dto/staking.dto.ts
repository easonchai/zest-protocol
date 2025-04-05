import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateStakeDto {
  @ApiProperty({
    description: 'The wallet address of the staker',
    example: '0x1234...',
  })
  @IsString()
  staker: string;

  @ApiProperty({
    description: 'Amount of ZEST to stake',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class StakeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  staker: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  sZestAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
