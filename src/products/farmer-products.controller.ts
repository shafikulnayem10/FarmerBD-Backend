import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { MyProductsQueryDto } from './dtos/my-products-query.dto.js';
import { ProductsService } from './products.service.js';

@Controller('farmers/me/products')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.FARMER)
export class FarmerProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getMyProducts(
    @CurrentUser('id') userId: string,
    @Query() query: MyProductsQueryDto,
  ) {
    return await this.productsService.getMyProducts(userId, query);
  }

  @Get(':id')
  async getMyProduct(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.productsService.getMyProduct(userId, id);
  }
}