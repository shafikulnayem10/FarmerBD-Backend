import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverySettings } from './entities/delivery-settings.entity.js';
import { DistrictLocation } from './entities/district-location.entity.js';
import { FuelPrice } from './entities/fuel-price.entity.js';
import { FuelPricesController } from './fuel-prices.controller.js';
import { PricingService } from './pricing.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FuelPrice, DeliverySettings, DistrictLocation]),
  ],
  controllers: [FuelPricesController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
