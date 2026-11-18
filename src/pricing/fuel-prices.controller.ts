import { Controller, Get } from '@nestjs/common';
import { PricingService } from './pricing.service.js';

@Controller('fuel-prices')
export class FuelPricesController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('current')
  async getCurrent() {
    return await this.pricingService.getCurrentFuelPrice();
  }
}
