import {Body,Controller,Get,HttpCode,HttpStatus,Patch,Post,UseGuards,} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { JwtGuard } from './jwtGuard.guard.js';
import { Roles } from './roles/roles/roles.decorator.js';
import { RolesGuard } from './roles/roles/roles.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.registration(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getProfile(@CurrentUser('id') userId: string) {
    return await this.authService.getProfile(userId);
  }

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(@CurrentUser('id') userId: string,@Body() dto: ChangePasswordDto,) {
    return await this.authService.changePassword(userId, dto);
  }

  @Get('admin-check')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminCheck() {
    return { message: 'Admin access granted' };
  }
}