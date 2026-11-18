import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { DeliveriesModule } from '../deliveries/deliveries.module.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Order } from '../orders/entities/order.entity.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { Product } from '../products/entities/product.entity.js';
import { StockAdjustment } from '../products/entities/stock-adjustment.entity.js';
import { ProductsModule } from '../products/products.module.js';
import { TransportersModule } from '../transporters/transporters.module.js';
import { Users } from '../users/entities/users.entity.js';
import { UsersModule } from '../users/users.module.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { AdminFarmersController } from './admin-farmers.controller.js';
import { AdminFarmersService } from './admin-farmers.service.js';
import { AdminLogsService } from './admin-logs.service.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { AdminPricingController } from './admin-pricing.controller.js';
import { AdminPricingService } from './admin-pricing.service.js';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminSeedService } from './admin-seed.service.js';
import { AdminTransportersController } from './admin-transporters.controller.js';
import { AdminTransportersService } from './admin-transporters.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminActionLog } from './entities/admin-action-log.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminActionLog,
      Users,
      FarmerProfile,
      Category,
      Product,
      StockAdjustment,
      Order,
    ]),
    UsersModule,
    ProductsModule,
    PricingModule,
    NotificationsModule,
    TransportersModule,
    DeliveriesModule,
  ],
  controllers: [
    AdminUsersController,
    AdminFarmersController,
    AdminTransportersController,
    AdminCategoriesController,
    AdminPricingController,
    AdminOrdersController,
    AdminProductsController,
  ],
  providers: [
    AdminSeedService,
    AdminLogsService,
    AdminUsersService,
    AdminFarmersService,
    AdminTransportersService,
    AdminCategoriesService,
    AdminPricingService,
    AdminOrdersService,
    AdminProductsService,
  ],
})
export class AdminModule {}
