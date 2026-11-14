import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module.js';
import { FarmersModule } from '../farmers/farmers.module.js';
import { CatalogService } from './catalog.service.js';
import { Product } from './entities/product.entity.js';
import { ProductImage } from './entities/product-image.entity.js';
import { FarmerProductsController } from './farmer-products.controller.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { PublicProductsController } from './public-products.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    CategoriesModule,
    FarmersModule,
  ],
  controllers: [
    ProductsController,
    FarmerProductsController,
    PublicProductsController,
  ],
  providers: [ProductsService, CatalogService],
  exports: [ProductsService],
})
export class ProductsModule {}