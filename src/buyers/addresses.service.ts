import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { isDistrictInDivision } from '../common/constants/bd-locations.js';
import { BuyersService } from './buyers.service.js';
import { CreateAddressDto } from './dtos/create-address.dto.js';
import { UpdateAddressDto } from './dtos/update-address.dto.js';
import { DeliveryAddress } from './entities/delivery-address.entity.js';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(DeliveryAddress)
    private readonly addressRepo: Repository<DeliveryAddress>,
    private readonly buyersService: BuyersService,
  ) {}

  async getMyAddresses(userId: string) {
    const profile = await this.buyersService.getOrCreateProfile(userId);
    const addresses = await this.addressRepo.find({
      where: { buyerId: profile.id },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return addresses.map((address) => this.toAddressResponse(address));
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const profile = await this.buyersService.getOrCreateProfile(userId);
    this.checkLocation(dto.division, dto.district);

    const count = await this.addressRepo.count({
      where: { buyerId: profile.id },
    });

    const address = this.addressRepo.create({
      buyerId: profile.id,
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      division: dto.division,
      district: dto.district,
      upazila: dto.upazila,
      addressLine: dto.addressLine,
      isDefault: count === 0 || dto.isDefault === true,
    });
    const saved = await this.addressRepo.save(address);

    if (saved.isDefault) {
      await this.clearOtherDefaults(profile.id, saved.id);
    }
    return this.toAddressResponse(saved);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.findOwnAddress(userId, addressId);

    if (dto.isDefault === false && address.isDefault) {
      throw new BadRequestException(
        'Choose another address as default instead of removing the default',
      );
    }

    address.label = dto.label ?? address.label;
    address.recipientName = dto.recipientName ?? address.recipientName;
    address.phone = dto.phone ?? address.phone;
    address.division = dto.division ?? address.division;
    address.district = dto.district ?? address.district;
    address.upazila = dto.upazila ?? address.upazila;
    address.addressLine = dto.addressLine ?? address.addressLine;
    if (dto.isDefault === true) {
      address.isDefault = true;
    }

    this.checkLocation(address.division, address.district);

    const saved = await this.addressRepo.save(address);
    if (dto.isDefault === true) {
      await this.clearOtherDefaults(saved.buyerId, saved.id);
    }
    return this.toAddressResponse(saved);
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.findOwnAddress(userId, addressId);
    await this.addressRepo.remove(address);

    if (address.isDefault) {
      const next = await this.addressRepo.findOne({
        where: { buyerId: address.buyerId },
        order: { createdAt: 'DESC' },
      });
      if (next) {
        next.isDefault = true;
        await this.addressRepo.save(next);
      }
    }
    return { message: 'Address deleted successfully' };
  }

  async findOwnAddress(userId: string, addressId: string) {
    const profile = await this.buyersService.getOrCreateProfile(userId);
    const address = await this.addressRepo.findOne({
      where: { id: addressId, buyerId: profile.id },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private async clearOtherDefaults(buyerId: string, keepId: string) {
    await this.addressRepo.update(
      { buyerId, id: Not(keepId) },
      { isDefault: false },
    );
  }

  private checkLocation(division: string, district: string) {
    if (!isDistrictInDivision(division, district)) {
      throw new BadRequestException(
        'district does not belong to the selected division',
      );
    }
  }

  private toAddressResponse(address: DeliveryAddress) {
    return {
      id: address.id,
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      division: address.division,
      district: address.district,
      upazila: address.upazila,
      addressLine: address.addressLine,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}