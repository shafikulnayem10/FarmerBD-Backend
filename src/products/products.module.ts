import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module.js';
import { FarmersModule } from '../farmers/farmers.module.js';
import { Product } from './entities/product.entity.js';
import { FarmerProductsController } from './farmer-products.controller.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule,
    FarmersModule,
  ],
  controllers: [ProductsController, FarmerProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}