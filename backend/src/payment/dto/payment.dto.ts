import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class BalanceDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;
}

export class PaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsEnum(['cBTC', 'ZEST', 'USDT'])
  token: 'cBTC' | 'ZEST' | 'USDT';

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  fromAddress: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  expiresIn?: number;
}

export class PreparePaymentDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;
}

export class RecordPaymentDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  txHash: string;
}

export class PaymentPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'EXPIRED'])
  status?: string;
}
