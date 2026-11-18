import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto.js';
import { AdminProductsService } from './admin-products.service.js';
import { ModerateProductDto } from './dtos/moderate-product.dto.js';

@Controller('admin/products')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Patch(':id/status')
  async moderate(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateProductDto,
  ) {
    return await this.adminProductsService.moderate(adminId, id, dto);
  }

  @Get(':id/stock-logs')
  async getStockLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return await this.adminProductsService.getStockLogs(id, query);
  }
}
