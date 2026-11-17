import {Body,Controller, Get,Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { BuyerOrdersService } from './buyer-orders.service.js';
import { BuyerOrdersQueryDto } from './dtos/buyer-orders-query.dto.js';
import { CancelOrderDto } from './dtos/cancel-order.dto.js';
import { CheckoutDto } from './dtos/checkout.dto.js';

@Controller()
export class BuyerOrdersController {
  constructor(private readonly buyerOrdersService: BuyerOrdersService) {}

  @Post('orders/checkout')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER)
  async checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckoutDto,
  ) {
    return await this.buyerOrdersService.checkout(userId, dto);
  }

  @Get('buyers/me/orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER)
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query() query: BuyerOrdersQueryDto,
  ) {
    return await this.buyerOrdersService.getMyOrders(userId, query);
  }

  @Get('orders/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER, Role.FARMER)
  async getOrderById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.buyerOrdersService.getOrderById(userId, role, id);
  }

  @Patch('orders/:id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER)
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return await this.buyerOrdersService.cancelOrder(userId, id, dto);
  }

  @Patch('orders/:id/confirm-delivery')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER)
  async confirmDelivery(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.buyerOrdersService.confirmDelivery(userId, id);
  }
}