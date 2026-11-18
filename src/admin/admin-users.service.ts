import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { UserStatus } from '../common/enums/user-status.enum.js';
import { VerificationStatus } from '../common/enums/verification-status.enum.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { TransporterProfile } from '../transporters/entities/transporter-profile.entity.js';
import { Users } from '../users/entities/users.entity.js';
import { AdminLogsService } from './admin-logs.service.js';
import { AdminUsersQueryDto } from './dtos/admin-users-query.dto.js';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(FarmerProfile)
    private readonly farmerRepo: Repository<FarmerProfile>,
    @InjectRepository(TransporterProfile)
    private readonly transporterRepo: Repository<TransporterProfile>,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  // FR-A14
  async getDashboard() {
    const roleRows = await this.userRepo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany<{ role: Role; count: string }>();

    const usersByRole: Record<string, number> = {};
    for (const role of Object.values(Role)) {
      usersByRole[role] = 0;
    }
    for (const row of roleRows) {
      usersByRole[row.role] = Number(row.count);
    }

    const statusRows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    const ordersByStatus: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      ordersByStatus[status] = 0;
    }
    for (const row of statusRows) {
      ordersByStatus[row.status] = Number(row.count);
    }

    // Total sales counts COMPLETED orders only, the same rule as the
    // farmer earnings summary (FR-F16).
    const totalSales = await this.orderRepo.sum('totalAmount', {
      status: OrderStatus.COMPLETED,
    });

    const pendingFarmers = await this.farmerRepo.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    });
    const pendingTransporters = await this.transporterRepo.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    });

    return {
      usersByRole,
      ordersByStatus,
      totalSales: totalSales ?? 0,
      pendingVerifications: {
        farmers: pendingFarmers,
        transporters: pendingTransporters,
      },
    };
  }

  // FR-A02
  async getUsers(query: AdminUsersQueryDto) {
    const base: FindOptionsWhere<Users> = {};
    if (query.role) {
      base.role = query.role;
    }
    if (query.status) {
      base.status = query.status;
    }

    let where: FindOptionsWhere<Users> | FindOptionsWhere<Users>[] = base;
    if (query.search) {
      const pattern = ILike(`%${query.search}%`);
      where = [
        { ...base, fullName: pattern },
        { ...base, email: pattern },
        { ...base, phone: pattern },
      ];
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: users.map((user) => this.toUserResponse(user)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  // FR-A03. A suspended user is already blocked by AuthService.login and
  // JwtStrategy.validate, so only the status needs to change here.
  async updateUserStatus(adminId: string, userId: string, dto: UpdateUserStatusDto) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(Users, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.role === Role.ADMIN) {
        throw new ForbiddenException('An Admin account cannot be suspended');
      }

      user.status = dto.status;
      const saved = await manager.save(user);

      await this.adminLogsService.log(
        manager,
        adminId,
        dto.status === UserStatus.SUSPENDED
          ? AdminAction.SUSPEND_USER
          : AdminAction.ACTIVATE_USER,
        'USER',
        user.id,
        dto.reason,
      );
      return this.toUserResponse(saved);
    });
  }

  private toUserResponse(user: Users) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
