import {Body,Controller,Get,HttpCode,HttpStatus,Patch,Post,UseGuards,} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { RequestMetaData } from '../common/interfaces/request-meta.interface.js';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import type { AuthUser } from './interfaces/auth-user.interface.js';
import { JwtGuard } from './jwtGuard.guard.js';
import { Roles } from './roles/roles/roles.decorator.js';
import { RolesGuard } from './roles/roles/roles.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @RequestMeta() meta: RequestMetaData) {
    return await this.authService.registration(dto, meta);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @RequestMeta() meta: RequestMetaData) {
    return await this.authService.login(dto, meta);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getProfile(@CurrentUser('id') userId: string) {
    return await this.authService.getProfile(userId);
  }

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @RequestMeta() meta: RequestMetaData,
  ) {
    return await this.authService.changePassword(user, dto, meta);
  }

  @Get('admin-check')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminCheck() {
    return { message: 'Admin access granted' };
  }
}