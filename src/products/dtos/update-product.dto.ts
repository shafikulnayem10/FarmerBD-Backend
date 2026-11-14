import { Transform } from 'class-transformer';
import {IsDateString,IsEnum,IsNumber,IsOptional,IsString,IsUUID,Max,MaxLength,Min,MinLength,} from 'class-validator';
import { ProductUnit } from '../../common/enums/product-unit.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class UpdateProductDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000)
  pricePerUnit?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(1000000)
  minOrderQuantity?: number;

  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;
}