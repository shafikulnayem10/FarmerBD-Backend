import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminPricingService } from './admin-pricing.service.js';
import { CreateFuelPriceDto } from './dtos/create-fuel-price.dto.js';
import { FuelPricesQueryDto } from './dtos/fuel-prices-query.dto.js';
import { UpdateDeliverySettingsDto } from './dtos/update-delivery-settings.dto.js';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPricingController {
  constructor(private readonly adminPricingService: AdminPricingService) {}

  @Get('fuel-prices')
  async getFuelPrices(@Query() query: FuelPricesQueryDto) {
    return await this.adminPricingService.getFuelPrices(query);
  }

  @Post('fuel-prices')
  async addFuelPrice(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateFuelPriceDto,
  ) {
    return await this.adminPricingService.addFuelPrice(adminId, dto);
  }

  @Get('delivery-settings')
  async getDeliverySettings() {
    return await this.adminPricingService.getDeliverySettings();
  }

  @Patch('delivery-settings')
  async updateDeliverySettings(
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateDeliverySettingsDto,
  ) {
    return await this.adminPricingService.updateDeliverySettings(adminId, dto);
  }
}
