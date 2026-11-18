import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString,  MaxLength } from 'class-validator';'../../common/constants/validation.constants.js';
import { BuyerType } from '../../common/enums/buyer-type.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class UpdateBuyerProfileDto {
  @IsOptional()
  @IsEnum(BuyerType)
  buyerType?: BuyerType;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  businessName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/^\+88/, '') : value,
  )
  
  phone?: string;
}