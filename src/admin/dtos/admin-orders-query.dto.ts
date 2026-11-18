import { IsDateString, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { BD_DISTRICTS } from '../../common/constants/bd-locations.js';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';

export class AdminOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  // Delivery district of the order (ship_district).
  @IsOptional()
  @IsIn(BD_DISTRICTS, { message: 'district must be a valid Bangladesh district' })
  district?: string;
}
