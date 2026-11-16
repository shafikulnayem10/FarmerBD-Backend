import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { trim } from '../../common/transformers/trim.transformer.js';

export class CheckoutDto {
  @IsUUID()
  addressId!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}