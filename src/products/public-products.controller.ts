import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { PublicProductsQueryDto } from './dtos/public-products-query.dto.js';

@Controller('products')
export class PublicProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async findAll(@Query() query: PublicProductsQueryDto) {
    return await this.catalogService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.catalogService.findOne(id);
  }
}