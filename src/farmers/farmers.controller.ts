import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { UpdateFarmerProfileDto } from './dtos/update-farmer-profile.dto.js';
import { FarmersService } from './farmers.service.js';

@Controller('farmers')
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get('me')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FARMER)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return await this.farmersService.getMyProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FARMER)
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFarmerProfileDto,
  ) {
    return await this.farmersService.updateMyProfile(userId, dto);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return await this.farmersService.getPublicProfile(id);
  }
}