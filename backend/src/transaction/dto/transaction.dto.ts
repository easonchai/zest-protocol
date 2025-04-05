import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TransactionPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(['SWAP', 'STAKE', 'CDP', 'STABILITY_DEPOSIT', 'ENS_REGISTER'])
  type?: string;
}

export class GetTransactionsByAddressDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class GetTransactionsByTypeDto {
  @IsEnum(['SWAP', 'STAKE', 'CDP', 'STABILITY_DEPOSIT', 'ENS_REGISTER'])
  @IsNotEmpty()
  type: string;
}
