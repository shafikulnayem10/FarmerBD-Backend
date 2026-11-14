import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  exports: [TypeOrmModule],
})
export class OrdersModule {}