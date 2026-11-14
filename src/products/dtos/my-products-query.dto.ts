import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto.js';
import { ProductStatus } from '../../common/enums/product-status.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class MyProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;
}