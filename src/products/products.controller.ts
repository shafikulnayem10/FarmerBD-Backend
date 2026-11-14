import {Body,Controller,Delete,Param,ParseUUIDPipe,Patch,Post,UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { UpdateStatusDto } from './dtos/update-status.dto.js';
import { UpdateStockDto } from './dtos/update-stock.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.FARMER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async createProduct(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return await this.productsService.createProduct(userId, dto);
  }

  @Patch(':id')
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(userId, id, dto);
  }

  @Patch(':id/stock')
  async updateStock(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return await this.productsService.updateStock(userId, id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.productsService.updateStatus(userId, id, dto);
  }

  @Delete(':id')
  async deleteProduct(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.productsService.deleteProduct(userId, id);
  }
}