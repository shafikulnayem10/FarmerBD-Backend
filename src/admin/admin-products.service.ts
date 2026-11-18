import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto.js';
import { Product } from '../products/entities/product.entity.js';
import { StockAdjustment } from '../products/entities/stock-adjustment.entity.js';
import { AdminLogsService } from './admin-logs.service.js';
import { ModerateProductDto } from './dtos/moderate-product.dto.js';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockAdjustment)
    private readonly stockRepo: Repository<StockAdjustment>,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async moderate(adminId: string, productId: string, dto: ModerateProductDto) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const oldStatus = product.status;
      product.status = dto.status;
      const saved = await manager.save(product);

      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.MODERATE_PRODUCT,
        'PRODUCT',
        product.id,
        `${oldStatus} -> ${dto.status}: ${dto.reason}`,
      );

      return {
        id: saved.id,
        name: saved.name,
        farmerId: saved.farmerId,
        status: saved.status,
        updatedAt: saved.updatedAt,
      };
    });
  }

  async getStockLogs(productId: string, query: PaginationQueryDto) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [logs, total] = await this.stockRepo.findAndCount({
      where: { productId: product.id },
      relations: { changer: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        oldQuantity: log.oldQuantity,
        newQuantity: log.newQuantity,
        change: Number((log.newQuantity - log.oldQuantity).toFixed(3)),
        reason: log.reason,
        changedBy: log.changer
          ? { id: log.changer.id, fullName: log.changer.fullName, role: log.changer.role }
          : null,
        createdAt: log.createdAt,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
