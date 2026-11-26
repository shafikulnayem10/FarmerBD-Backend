import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BuyerOrdersModule } from './buyer-orders/buyer-orders.module.js';
import { BuyersModule } from './buyers/buyers.module.js';
import { CartModule } from './cart/cart.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { DeliveriesModule } from './deliveries/deliveries.module.js';
import { FarmerOrdersModule } from './farmer-orders/farmer-orders.module.js';
import { FarmersModule } from './farmers/farmers.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { ProductsModule } from './products/products.module.js';
import { RootController } from './root/root.controller.js';
import { TransportersModule } from './transporters/transporters.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    FarmersModule,
    CategoriesModule,
    ProductsModule,
    BuyersModule,
    OrdersModule,
    FarmerOrdersModule,
    CartModule,
    BuyerOrdersModule,
    NotificationsModule,
    PricingModule,
    TransportersModule,
    DeliveriesModule,
    AdminModule,
  ],
  controllers: [RootController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*path');
  }
}