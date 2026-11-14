import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmersModule } from '../farmers/farmers.module.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { ProductsModule } from '../products/products.module.js';
import { FarmerOrdersController } from './farmer-orders.controller.js';
import { FarmerOrdersService } from './farmer-orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    FarmersModule,
    ProductsModule,
  ],
  controllers: [FarmerOrdersController],
  providers: [FarmerOrdersService],
})
export class FarmerOrdersModule {}