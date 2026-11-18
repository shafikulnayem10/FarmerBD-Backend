import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { AdminOrdersQueryDto } from './dtos/admin-orders-query.dto.js';
import { AdminReasonDto } from './dtos/admin-reason.dto.js';
import { AssignTransporterDto } from './dtos/assign-transporter.dto.js';

@Controller('admin/orders')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  async getOrders(@Query() query: AdminOrdersQueryDto) {
    return await this.adminOrdersService.getOrders(query);
  }

  @Get(':id')
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminOrdersService.getOrderById(id);
  }

  @Patch(':id/assign-transporter')
  async assignTransporter(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTransporterDto,
  ) {
    return await this.adminOrdersService.assignTransporter(adminId, id, dto);
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return await this.adminOrdersService.cancelOrder(adminId, id, dto);
  }
}
