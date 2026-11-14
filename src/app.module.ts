import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { FarmersModule } from './farmers/farmers.module.js';
import { ProductsModule } from './products/products.module.js';
 import { UsersModule } from './users/users.module.js';
  import { BuyersModule } from './buyers/buyers.module.js';

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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*path');
  }
}