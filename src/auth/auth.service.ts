import {BadRequestException,ForbiddenException,Injectable,UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../common/enums/user-status.enum.js';
import { Users } from '../users/entities/users.entity.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { RegisterDto } from './dtos/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registration(dto: RegisterDto) {
    const hashPass = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      password: hashPass,
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.getUserByEmailWithPassword(dto.email);
    const matchPass = user ? await bcrypt.compare(dto.password, user.password) : false;

    if (!user || !matchPass) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended');
    }
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.getUserByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const matchPass = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matchPass) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, newHash);
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