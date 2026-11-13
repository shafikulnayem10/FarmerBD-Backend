import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isDistrictInDivision } from '../common/constants/bd-locations.js';
import { VerificationStatus } from '../common/enums/verification-status.enum.js';
import { UpdateFarmerProfileDto } from './dtos/update-farmer-profile.dto.js';
import { FarmerProfile } from './entities/farmer-profile.entity.js';

const EDITABLE_FIELDS = [
  'farmName',
  'division',
  'district',
  'upazila',
  'addressLine',
  'farmSizeAcres',
  'primaryCrops',
  'bio',
] as const;

function isUniqueViolation(error: unknown): boolean {
  const driverError = (error as { driverError?: { code?: string } } | null)
    ?.driverError;
  return driverError?.code === '23505';
}

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(FarmerProfile)
    private readonly profileRepo: Repository<FarmerProfile>,
  ) {}

  async getOrCreateProfile(userId: string): Promise<FarmerProfile> {
    const existing = await this.profileRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }

    try {
      const profile = this.profileRepo.create({ userId, primaryCrops: [] });
      return await this.profileRepo.save(profile);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const created = await this.profileRepo.findOne({ where: { userId } });
        if (created) {
          return created;
        }
      }
      throw error;
    }
  }

  isProfileComplete(profile: FarmerProfile): boolean {
    return Boolean(profile.farmName && profile.district);
  }

  async getMyProfile(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    return this.toProfileResponse(profile);
  }

  async updateMyProfile(userId: string, dto: UpdateFarmerProfileDto) {
    const profile = await this.getOrCreateProfile(userId);

    const changes: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      const incoming = dto[field];
      if (incoming === undefined) {
        continue;
      }
      if (JSON.stringify(incoming) === JSON.stringify(profile[field])) {
        continue;
      }
      changes[field] = incoming;
    }

    if (Object.keys(changes).length === 0) {
      return this.toProfileResponse(profile);
    }

    const division = (changes.division as string | undefined) ?? profile.division;
    const district = (changes.district as string | undefined) ?? profile.district;
    this.assertLocation(division, district);

    Object.assign(profile, changes);
    const saved = await this.profileRepo.save(profile);
    return this.toProfileResponse(saved);
  }

  async getPublicProfile(profileId: string) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException('Farmer not found');
    }

    return {
      id: profile.id,
      farmName: profile.farmName,
      division: profile.division,
      district: profile.district,
      upazila: profile.upazila,
      farmSizeAcres: profile.farmSizeAcres,
      primaryCrops: profile.primaryCrops,
      bio: profile.bio,
      verificationStatus: profile.verificationStatus,
      memberSince: profile.createdAt,
    };
  }

  async setVerificationStatus(profileId: string, status: VerificationStatus) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }

    profile.verificationStatus = status;
    const saved = await this.profileRepo.save(profile);
    return this.toProfileResponse(saved);
  }

  private assertLocation(division: string | null, district: string | null) {
    if (district && !division) {
      throw new BadRequestException('division is required when district is set');
    }
    if (division && district && !isDistrictInDivision(division, district)) {
      throw new BadRequestException(
        'district does not belong to the selected division',
      );
    }
  }

  private toProfileResponse(profile: FarmerProfile) {
    return {
      id: profile.id,
      userId: profile.userId,
      farmName: profile.farmName,
      division: profile.division,
      district: profile.district,
      upazila: profile.upazila,
      addressLine: profile.addressLine,
      farmSizeAcres: profile.farmSizeAcres,
      primaryCrops: profile.primaryCrops,
      bio: profile.bio,
      verificationStatus: profile.verificationStatus,
      profileComplete: this.isProfileComplete(profile),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}