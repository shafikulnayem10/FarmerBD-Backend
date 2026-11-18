import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminUsersQueryDto } from './dtos/admin-users-query.dto.js';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto.js';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('dashboard')
  async getDashboard() {
    return await this.adminUsersService.getDashboard();
  }

  @Get('users')
  async getUsers(@Query() query: AdminUsersQueryDto) {
    return await this.adminUsersService.getUsers(query);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return await this.adminUsersService.updateUserStatus(adminId, id, dto);
  }
}
