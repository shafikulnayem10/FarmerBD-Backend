import { IsIn } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum.js';

export class UpdateOrderStatusDto {
  @IsIn(
    [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.DELIVERED],
    { message: 'status must be one of PREPARING, READY_FOR_PICKUP, DELIVERED' },
  )
  status!: OrderStatus;
}