import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { VerificationStatus } from '../common/enums/verification-status.enum.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AdminLogsService } from './admin-logs.service.js';
import { AdminFarmersQueryDto } from './dtos/admin-farmers-query.dto.js';
import { VerificationDto } from './dtos/verification.dto.js';

@Injectable()
export class AdminFarmersService {
  constructor(
    @InjectRepository(FarmerProfile)
    private readonly farmerRepo: Repository<FarmerProfile>,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // FR-A04: list farmers, usually filtered by verificationStatus=PENDING
  async getFarmers(query: AdminFarmersQueryDto) {
    const where: FindOptionsWhere<FarmerProfile> = {};
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.district) {
      where.district = query.district;
    }

    const [farmers, total] = await this.farmerRepo.findAndCount({
      where,
      relations: { user: true },
      order: { createdAt: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: farmers.map((farmer) => this.toFarmerResponse(farmer)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  // FR-A04: verify or reject, then notify the farmer (backs FR-F04)
  async setVerification(adminId: string, farmerId: string, dto: VerificationDto) {
    return await this.dataSource.transaction(async (manager) => {
      const farmer = await manager.findOne(FarmerProfile, {
        where: { id: farmerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!farmer) {
        throw new NotFoundException('Farmer not found');
      }

      farmer.verificationStatus = dto.status;
      const saved = await manager.save(farmer);

      const verified = dto.status === VerificationStatus.VERIFIED;
      await this.adminLogsService.log(
        manager,
        adminId,
        verified ? AdminAction.VERIFY_FARMER : AdminAction.REJECT_FARMER,
        'FARMER_PROFILE',
        farmer.id,
        dto.reason,
      );
      await this.notificationsService.notify(manager, {
        userId: farmer.userId,
        type: verified ? 'FARMER_VERIFIED' : 'FARMER_REJECTED',
        title: verified ? 'Your farm is verified' : 'Your farm verification was rejected',
        message: verified
          ? 'An Admin has verified your farm profile.'
          : `An Admin rejected your farm profile. Reason: ${dto.reason}`,
        resourceType: 'FARMER_PROFILE',
        resourceId: farmer.id,
      });

      return {
        id: saved.id,
        verificationStatus: saved.verificationStatus,
        updatedAt: saved.updatedAt,
      };
    });
  }

  private toFarmerResponse(farmer: FarmerProfile) {
    return {
      id: farmer.id,
      userId: farmer.userId,
      fullName: farmer.user.fullName,
      email: farmer.user.email,
      phone: farmer.user.phone,
      userStatus: farmer.user.status,
      farmName: farmer.farmName,
      division: farmer.division,
      district: farmer.district,
      upazila: farmer.upazila,
      addressLine: farmer.addressLine,
      farmSizeAcres: farmer.farmSizeAcres,
      primaryCrops: farmer.primaryCrops,
      verificationStatus: farmer.verificationStatus,
      createdAt: farmer.createdAt,
    };
  }
}
