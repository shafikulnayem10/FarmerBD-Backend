import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Roles } from '../auth/roles/roles/roles.decorator.js';
import { RolesGuard } from '../auth/roles/roles/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';

@Controller('admin/categories')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) {}

  @Get()
  async getAll() {
    return await this.adminCategoriesService.getAll();
  }

  @Post()
  async create(@CurrentUser('id') adminId: string, @Body() dto: CreateCategoryDto) {
    return await this.adminCategoriesService.create(adminId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.adminCategoriesService.update(adminId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.adminCategoriesService.delete(adminId, id);
  }
}
