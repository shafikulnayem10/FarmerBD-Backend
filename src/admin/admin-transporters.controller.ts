import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminTransportersService } from './admin-transporters.service.js';
import { AdminTransportersQueryDto } from './dtos/admin-transporters-query.dto.js';
import { CreateTransporterDto } from './dtos/create-transporter.dto.js';
import { VerificationDto } from './dtos/verification.dto.js';

@Controller('admin/transporters')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTransportersController {
  constructor(private readonly adminTransportersService: AdminTransportersService) {}

  @Post()
  async createTransporter(@Body() dto: CreateTransporterDto) {
    return await this.adminTransportersService.createTransporter(dto);
  }

  @Get()
  async getTransporters(@Query() query: AdminTransportersQueryDto) {
    return await this.adminTransportersService.getTransporters(query);
  }

  @Patch(':id/verification')
  async setVerification(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerificationDto,
  ) {
    return await this.adminTransportersService.setVerification(adminId, id, dto);
  }
}
