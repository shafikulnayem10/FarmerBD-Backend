import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Query,UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { FarmerOrdersQueryDto } from './dtos/farmer-orders-query.dto.js';
import { RejectOrderDto } from './dtos/reject-order.dto.js';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto.js';
import { FarmerOrdersService } from './farmer-orders.service.js';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.FARMER)
export class FarmerOrdersController {
  constructor(private readonly farmerOrdersService: FarmerOrdersService) {}

  @Get('farmers/me/orders')
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query() query: FarmerOrdersQueryDto,
  ) {
    return await this.farmerOrdersService.getMyOrders(userId, query);
  }

  @Patch('orders/:id/accept')
  async acceptOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.farmerOrdersService.acceptOrder(userId, id);
  }

  @Patch('orders/:id/reject')
  async rejectOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOrderDto,
  ) {
    return await this.farmerOrdersService.rejectOrder(userId, id, dto);
  }

  @Patch('orders/:id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return await this.farmerOrdersService.updateStatus(userId, id, dto);
  }
}