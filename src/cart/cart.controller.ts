import { Body, Controller,Delete,Get, Param, ParseUUIDPipe,Patch,Post, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dtos/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto.js';

@Controller('cart')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.BUYER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return await this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return await this.cartService.addItem(userId, dto);
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateItem(userId, itemId, dto);
  }

  @Delete('items/:itemId')
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return await this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    return await this.cartService.clearCart(userId);
  }
}