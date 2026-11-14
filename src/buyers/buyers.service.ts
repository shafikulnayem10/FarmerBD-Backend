import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service.js';
import { UpdateBuyerProfileDto } from './dtos/update-buyer-profile.dto.js';
import { BuyerProfile } from './entities/buyer-profile.entity.js';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(BuyerProfile)
    private readonly profileRepo: Repository<BuyerProfile>,
    private readonly usersService: UsersService,
  ) {}

  async getOrCreateProfile(userId: string): Promise<BuyerProfile> {
    const existing = await this.profileRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const profile = this.profileRepo.create({ userId });
    return await this.profileRepo.save(profile);
  }

  async getMyProfile(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: profile.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      buyerType: profile.buyerType,
      businessName: profile.businessName,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateBuyerProfileDto) {
    const profile = await this.getOrCreateProfile(userId);

    if (dto.phone !== undefined) {
      await this.usersService.updatePhone(userId, dto.phone);
    }
    if (dto.buyerType !== undefined) {
      profile.buyerType = dto.buyerType;
    }
    if (dto.businessName !== undefined) {
      profile.businessName = dto.businessName;
    }

    await this.profileRepo.save(profile);
    return await this.getMyProfile(userId);
  }
}