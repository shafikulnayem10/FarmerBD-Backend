import { Module } from '@nestjs/common';
import { BuyersModule } from '../buyers/buyers.module.js';
import { ProductsModule } from '../products/products.module.js';
import { BuyerOrdersController } from './buyer-orders.controller.js';
import { BuyerOrdersService } from './buyer-orders.service.js';

@Module({
  imports: [BuyersModule, ProductsModule],
  controllers: [BuyerOrdersController],
  providers: [BuyerOrdersService],
  exports: [BuyerOrdersService],
})
export class BuyerOrdersModule {}