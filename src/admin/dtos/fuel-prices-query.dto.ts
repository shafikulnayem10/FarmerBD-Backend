import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto.js';
import { FuelType } from '../../common/enums/fuel-type.enum.js';

export class FuelPricesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;
}
