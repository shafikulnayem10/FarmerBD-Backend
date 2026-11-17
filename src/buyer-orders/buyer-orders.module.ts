import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyersModule } from '../buyers/buyers.module.js';
import { FarmersModule } from '../farmers/farmers.module.js';
import { Order } from '../orders/entities/order.entity.js';
import { ProductsModule } from '../products/products.module.js';
import { BuyerOrdersController } from './buyer-orders.controller.js';
import { BuyerOrdersService } from './buyer-orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    BuyersModule,
    FarmersModule,
    ProductsModule,
  ],
  controllers: [BuyerOrdersController],
  providers: [BuyerOrdersService],
  exports: [BuyerOrdersService],
})
export class BuyerOrdersModule {}