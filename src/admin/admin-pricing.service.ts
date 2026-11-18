import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { PricingService } from '../pricing/pricing.service.js';
import { AdminLogsService } from './admin-logs.service.js';
import { CreateFuelPriceDto } from './dtos/create-fuel-price.dto.js';
import { FuelPricesQueryDto } from './dtos/fuel-prices-query.dto.js';
import { UpdateDeliverySettingsDto } from './dtos/update-delivery-settings.dto.js';

const SETTING_FIELDS = [
  'mileageKmPerLiter',
  'operatingFactor',
  'baseFare',
  'minFare',
  'roadDistanceFactor',
] as const;

@Injectable()
export class AdminPricingService {
  constructor(
    private readonly pricingService: PricingService,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  // FR-A07
  async getFuelPrices(query: FuelPricesQueryDto) {
    return await this.pricingService.getFuelPriceHistory(
      query.fuelType,
      query.page,
      query.limit,
    );
  }

  // A new row is added each time; old prices are kept as history and
  // deliveries keep the price they were created with (snapshot).
  async addFuelPrice(adminId: string, dto: CreateFuelPriceDto) {
    return await this.dataSource.transaction(async (manager) => {
      const price = await this.pricingService.addFuelPrice(manager, adminId, dto);
      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.UPDATE_FUEL_PRICE,
        'FUEL_PRICE',
        price.id,
        `${price.fuelType} ${price.pricePerLiter} from ${price.effectiveFrom}`,
      );
      return price;
    });
  }

  // FR-A08
  async getDeliverySettings() {
    return await this.pricingService.getDeliverySettings();
  }

  async updateDeliverySettings(adminId: string, dto: UpdateDeliverySettingsDto) {
    return await this.dataSource.transaction(async (manager) => {
      const settings = await this.pricingService.getDeliverySettings(manager);

      const changes: string[] = [];
      for (const field of SETTING_FIELDS) {
        const incoming = dto[field];
        if (incoming !== undefined && incoming !== settings[field]) {
          changes.push(`${field}: ${settings[field]} -> ${incoming}`);
          settings[field] = incoming;
        }
      }
      if (changes.length === 0) {
        return settings;
      }

      const saved = await manager.save(settings);
      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.UPDATE_DELIVERY_SETTINGS,
        'DELIVERY_SETTINGS',
        settings.id,
        changes.join('; '),
      );
      return saved;
    });
  }
}
