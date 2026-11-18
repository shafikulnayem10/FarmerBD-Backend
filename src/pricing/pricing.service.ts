import { ConflictException, Injectable, NotFoundException, OnApplicationBootstrap,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { roundMoney } from '../cart/cart-math.js';
import { FuelType } from '../common/enums/fuel-type.enum.js';
import { DISTRICT_COORDINATES } from './district-coordinates.js';
import { DeliverySettings } from './entities/delivery-settings.entity.js';
import { DistrictLocation } from './entities/district-location.entity.js';
import { FuelPrice } from './entities/fuel-price.entity.js';

// Starting values only. The Admin changes them with PATCH /admin/delivery-settings.
const DEFAULT_DELIVERY_SETTINGS = {
  mileageKmPerLiter: 8,
  operatingFactor: 2.5,
  baseFare: 150,
  minFare: 300,
  roadDistanceFactor: 1.3,
};

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class PricingService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(FuelPrice)
    private readonly fuelPriceRepo: Repository<FuelPrice>,
    @InjectRepository(DeliverySettings)
    private readonly settingsRepo: Repository<DeliverySettings>,
    @InjectRepository(DistrictLocation)
    private readonly districtRepo: Repository<DistrictLocation>,
  ) {}

  async onApplicationBootstrap() {
    const districts = await this.districtRepo.count();
    if (districts === 0) {
      await this.districtRepo.save(DISTRICT_COORDINATES);
    }

    const settings = await this.settingsRepo.count();
    if (settings === 0) {
      await this.settingsRepo.save(DEFAULT_DELIVERY_SETTINGS);
    }
  }

  async getCurrentFuelPrice(fuelType: FuelType = FuelType.DIESEL) {
    const price = await this.findCurrentFuelPrice(this.fuelPriceRepo.manager, fuelType);
    if (!price) {
      throw new NotFoundException('No fuel price has been set yet');
    }
    return this.toFuelPriceResponse(price);
  }

  async getFuelPriceHistory(fuelType: FuelType | undefined, page: number, limit: number) {
    const where: FindOptionsWhere<FuelPrice> = {};
    if (fuelType) {
      where.fuelType = fuelType;
    }

    const [prices, total] = await this.fuelPriceRepo.findAndCount({
      where,
      order: { effectiveFrom: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: prices.map((price) => this.toFuelPriceResponse(price)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async addFuelPrice(
    manager: EntityManager,
    adminId: string,
    data: { fuelType: FuelType; pricePerLiter: number; effectiveFrom: string },
  ) {
    const existing = await manager.findOne(FuelPrice, {
      where: { fuelType: data.fuelType, effectiveFrom: data.effectiveFrom },
    });
    if (existing) {
      throw new ConflictException(
        `A ${data.fuelType} price already exists for ${data.effectiveFrom}`,
      );
    }

    const price = manager.create(FuelPrice, { ...data, createdBy: adminId });
    const saved = await manager.save(price);
    return this.toFuelPriceResponse(saved);
  }

  async getDeliverySettings(manager: EntityManager = this.settingsRepo.manager) {
    const settings = await manager.findOne(DeliverySettings, { where: {} });
    if (!settings) {
      throw new NotFoundException('Delivery settings are not set up');
    }
    return settings;
  }

  // Fare used for the delivery snapshot (FR-T09):
  // road km = straight-line km between the two districts x roadDistanceFactor
  // fuel cost = road km / mileageKmPerLiter x current diesel price
  // fare = baseFare + fuel cost x operatingFactor, never below minFare
  async calculateFare(manager: EntityManager, fromDistrict: string, toDistrict: string) {
    const from = await manager.findOne(DistrictLocation, {
      where: { district: fromDistrict },
    });
    const to = await manager.findOne(DistrictLocation, {
      where: { district: toDistrict },
    });
    if (!from || !to) {
      throw new ConflictException('District location not found for fare calculation');
    }

    const fuelPrice = await this.findCurrentFuelPrice(manager, FuelType.DIESEL);
    if (!fuelPrice) {
      throw new ConflictException('Set a diesel price before assigning deliveries');
    }
    const settings = await this.getDeliverySettings(manager);

    const straightKm = this.haversineKm(from, to);
    const distanceKm = roundMoney(straightKm * settings.roadDistanceFactor);
    const fuelCost = (distanceKm / settings.mileageKmPerLiter) * fuelPrice.pricePerLiter;
    const fare = Math.max(
      settings.minFare,
      settings.baseFare + fuelCost * settings.operatingFactor,
    );

    return {
      distanceKm,
      fuelPrice: fuelPrice.pricePerLiter,
      fareAmount: roundMoney(fare),
    };
  }

  private async findCurrentFuelPrice(manager: EntityManager, fuelType: FuelType) {
    return await manager.findOne(FuelPrice, {
      where: { fuelType, effectiveFrom: LessThanOrEqual(this.todayInDhaka()) },
      order: { effectiveFrom: 'DESC' },
    });
  }

  // effective_from is a date, so "today" is taken in Bangladesh time,
  // not UTC, to avoid a 6-hour gap after midnight.
  private todayInDhaka() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(
      new Date(),
    );
  }

  private haversineKm(from: DistrictLocation, to: DistrictLocation) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from.latitude)) *
        Math.cos(toRad(to.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
  }

  private toFuelPriceResponse(price: FuelPrice) {
    return {
      id: price.id,
      fuelType: price.fuelType,
      pricePerLiter: price.pricePerLiter,
      effectiveFrom: price.effectiveFrom,
      createdBy: price.createdBy,
    };
  }
}
