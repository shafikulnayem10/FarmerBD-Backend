import { Transform, Type } from 'class-transformer';
import {IsBoolean,IsIn,IsNumber,IsOptional, IsString, IsUUID, MaxLength, Min,} from 'class-validator';
import { BD_DISTRICTS } from '../../common/constants/bd-locations.js';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class PublicProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(BD_DISTRICTS, { message: 'district must be a valid Bangladesh district' })
  district?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'], {
    message: 'sort must be one of newest, price_asc, price_desc',
  })
  sort?: 'newest' | 'price_asc' | 'price_desc';
}