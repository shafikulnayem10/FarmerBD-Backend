import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { BuyersService } from './buyers.service.js';
import { UpdateBuyerProfileDto } from './dtos/update-buyer-profile.dto.js';

@Controller('buyers')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.BUYER)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return await this.buyersService.getMyProfile(userId);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBuyerProfileDto,
  ) {
    return await this.buyersService.updateMyProfile(userId, dto);
  }
}