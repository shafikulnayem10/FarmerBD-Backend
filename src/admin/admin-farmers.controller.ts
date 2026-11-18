import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminFarmersService } from './admin-farmers.service.js';
import { AdminFarmersQueryDto } from './dtos/admin-farmers-query.dto.js';
import { VerificationDto } from './dtos/verification.dto.js';

@Controller('admin/farmers')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFarmersController {
  constructor(private readonly adminFarmersService: AdminFarmersService) {}

  @Get()
  async getFarmers(@Query() query: AdminFarmersQueryDto) {
    return await this.adminFarmersService.getFarmers(query);
  }

  @Patch(':id/verification')
  async setVerification(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerificationDto,
  ) {
    return await this.adminFarmersService.setVerification(adminId, id, dto);
  }
}
