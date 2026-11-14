import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  BD_DISTRICTS,
  BD_DIVISIONS,
} from '../../common/constants/bd-locations.js';
import {
  PHONE_MESSAGE,
  PHONE_REGEX,
} from '../../common/constants/validation.constants.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class UpdateAddressDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/^\+88/, '') : value,
  )
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @IsIn(BD_DIVISIONS, { message: 'division must be a valid Bangladesh division' })
  division?: string;

  @IsOptional()
  @IsIn(BD_DISTRICTS, { message: 'district must be a valid Bangladesh district' })
  district?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  upazila?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}