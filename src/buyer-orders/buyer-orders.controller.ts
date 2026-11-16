import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { BuyerOrdersService } from './buyer-orders.service.js';
import { CheckoutDto } from './dtos/checkout.dto.js';

@Controller('orders')
export class BuyerOrdersController {
  constructor(private readonly buyerOrdersService: BuyerOrdersService) {}

  @Post('checkout')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.BUYER)
  async checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckoutDto,
  ) {
    return await this.buyerOrdersService.checkout(userId, dto);
  }
}