import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyersModule } from '../buyers/buyers.module.js';
import { Product } from '../products/entities/product.entity.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { CartItem } from './entities/cart-item.entity.js';
import { Cart } from './entities/cart.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product]), BuyersModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}