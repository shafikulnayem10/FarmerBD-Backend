import { BadRequestException,ForbiddenException,Injectable,UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service.js';
import { UserStatus } from '../common/enums/user-status.enum.js';
import type { RequestMetaData } from '../common/interfaces/request-meta.interface.js';
import { Users } from '../users/entities/users.entity.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import type { AuthUser } from './interfaces/auth-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async registration(dto: RegisterDto, meta: RequestMetaData) {
    const hashPass = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      password: hashPass,
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
      meta,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto, meta: RequestMetaData) {
    const user = await this.usersService.getUserByEmailWithPassword(dto.email);
    const matchPass = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !matchPass) {
      await this.auditService.log({
        actorUserId: user?.id ?? null,
        actorRole: user?.role ?? null,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user?.id ?? null,
        newValue: {
          email: dto.email.slice(0, 150),
          reason: 'INVALID_CREDENTIALS',
        },
        meta,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.auditService.log({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        newValue: { email: user.email, reason: 'ACCOUNT_SUSPENDED' },
        meta,
      });
      throw new ForbiddenException('Account is suspended');
    }

    await this.auditService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      meta,
    });

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return user;
  }

  async changePassword(
    authUser: AuthUser,
    dto: ChangePasswordDto,
    meta: RequestMetaData,
  ) {
    const user = await this.usersService.getUserByIdWithPassword(authUser.id);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const matchPass = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matchPass) {
      await this.auditService.log({
        actorUserId: authUser.id,
        actorRole: authUser.role,
        action: 'PASSWORD_CHANGE_FAILED',
        entityType: 'USER',
        entityId: authUser.id,
        meta,
      });
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(authUser.id, newHash);

    await this.auditService.log({
      actorUserId: authUser.id,
      actorRole: authUser.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: authUser.id,
      meta,
    });

    return { message: 'Password changed successfully' };
  }

  private buildAuthResponse(user: Users) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  }
}