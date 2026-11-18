import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { VerificationStatus } from '../common/enums/verification-status.enum.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TransporterProfile } from '../transporters/entities/transporter-profile.entity.js';
import { Users } from '../users/entities/users.entity.js';
import { AdminLogsService } from './admin-logs.service.js';
import { AdminTransportersQueryDto } from './dtos/admin-transporters-query.dto.js';
import { CreateTransporterDto } from './dtos/create-transporter.dto.js';
import { VerificationDto } from './dtos/verification.dto.js';

@Injectable()
export class AdminTransportersService {
  constructor(
    @InjectRepository(TransporterProfile)
    private readonly transporterRepo: Repository<TransporterProfile>,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // FR-A05: the user and the profile are created in one transaction, so a
  // duplicate vehicle or licence number doesn't leave a user without a profile.
  // The new transporter starts as PENDING until the Admin verifies the
  // licence and vehicle.
  async createTransporter(dto: CreateTransporterDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(Users, {
        where: [{ email: dto.email }, { phone: dto.phone }],
      });
      if (existingUser) {
        throw new ConflictException(
          existingUser.email === dto.email
            ? 'Email is already registered'
            : 'Phone number is already registered',
        );
      }

      const existingProfile = await manager.findOne(TransporterProfile, {
        where: [
          { vehicleNumber: dto.vehicleNumber },
          { licenseNumber: dto.licenseNumber },
        ],
      });
      if (existingProfile) {
        throw new ConflictException(
          existingProfile.vehicleNumber === dto.vehicleNumber
            ? 'Vehicle number is already registered'
            : 'Licence number is already registered',
        );
      }

      const user = await manager.save(
        manager.create(Users, {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          password: await bcrypt.hash(dto.password, 10),
          role: Role.TRANSPORTER,
        }),
      );

      const profile = await manager.save(
        manager.create(TransporterProfile, {
          userId: user.id,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber,
          capacityKg: dto.capacityKg,
          licenseNumber: dto.licenseNumber,
          baseDistrict: dto.baseDistrict,
          serviceDistricts: dto.serviceDistricts,
        }),
      );
      profile.user = user;
      return this.toTransporterResponse(profile);
    });
  }

  async getTransporters(query: AdminTransportersQueryDto) {
    const builder = this.transporterRepo
      .createQueryBuilder('transporter')
      .innerJoinAndSelect('transporter.user', 'user')
      .orderBy('transporter.createdAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.verificationStatus) {
      builder.andWhere('transporter.verificationStatus = :verificationStatus', {
        verificationStatus: query.verificationStatus,
      });
    }
    if (query.availability) {
      builder.andWhere('transporter.availability = :availability', {
        availability: query.availability,
      });
    }
    // A transporter matches a district if it is the base district or one
    // of the service districts.
    if (query.district) {
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('transporter.baseDistrict = :district').orWhere(
            ':district = ANY(transporter.serviceDistricts)',
          );
        }),
        { district: query.district },
      );
    }

    const [transporters, total] = await builder.getManyAndCount();
    return {
      data: transporters.map((t) => this.toTransporterResponse(t)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async setVerification(adminId: string, transporterId: string, dto: VerificationDto) {
    return await this.dataSource.transaction(async (manager) => {
      const transporter = await manager.findOne(TransporterProfile, {
        where: { id: transporterId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transporter) {
        throw new NotFoundException('Transporter not found');
      }

      const verified = dto.status === VerificationStatus.VERIFIED;
      transporter.verificationStatus = dto.status;
      transporter.rejectionReason = verified ? null : (dto.reason ?? null);
      transporter.verifiedBy = adminId;
      transporter.verifiedAt = new Date();
      const saved = await manager.save(transporter);

      await this.adminLogsService.log(
        manager,
        adminId,
        verified ? AdminAction.VERIFY_TRANSPORTER : AdminAction.REJECT_TRANSPORTER,
        'TRANSPORTER_PROFILE',
        transporter.id,
        dto.reason,
      );
      await this.notificationsService.notify(manager, {
        userId: transporter.userId,
        type: verified ? 'TRANSPORTER_VERIFIED' : 'TRANSPORTER_REJECTED',
        title: verified
          ? 'Your transporter account is verified'
          : 'Your transporter verification was rejected',
        message: verified
          ? 'An Admin has verified your licence and vehicle. You can now take jobs.'
          : `An Admin rejected your licence or vehicle. Reason: ${dto.reason}`,
        resourceType: 'TRANSPORTER_PROFILE',
        resourceId: transporter.id,
      });

      return {
        id: saved.id,
        verificationStatus: saved.verificationStatus,
        rejectionReason: saved.rejectionReason,
        verifiedAt: saved.verifiedAt,
      };
    });
  }

  private toTransporterResponse(transporter: TransporterProfile) {
    return {
      id: transporter.id,
      userId: transporter.userId,
      fullName: transporter.user.fullName,
      email: transporter.user.email,
      phone: transporter.user.phone,
      userStatus: transporter.user.status,
      vehicleType: transporter.vehicleType,
      vehicleNumber: transporter.vehicleNumber,
      capacityKg: transporter.capacityKg,
      licenseNumber: transporter.licenseNumber,
      baseDistrict: transporter.baseDistrict,
      serviceDistricts: transporter.serviceDistricts,
      availability: transporter.availability,
      verificationStatus: transporter.verificationStatus,
      rejectionReason: transporter.rejectionReason,
      verifiedAt: transporter.verifiedAt,
      createdAt: transporter.createdAt,
    };
  }
}
