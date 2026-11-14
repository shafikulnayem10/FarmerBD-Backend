import {BadRequestException,ConflictException, Injectable, NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service.js';
import { ProductStatus } from '../common/enums/product-status.enum.js';
import { FarmersService } from '../farmers/farmers.service.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { MyProductsQueryDto } from './dtos/my-products-query.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { UpdateStatusDto } from './dtos/update-status.dto.js';
import { UpdateStockDto } from './dtos/update-stock.dto.js';
import { Product } from './entities/product.entity.js';
import type { StockItem } from './interfaces/stock-item.interface.js';

const EDITABLE_FIELDS = [
  'name',
  'description',
  'categoryId',
  'unit',
  'pricePerUnit',
  'minOrderQuantity',
  'harvestDate',
  'availableFrom',
] as const;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly categoriesService: CategoriesService,
    private readonly farmersService: FarmersService,
  ) {}

  async createProduct(userId: string, dto: CreateProductDto) {
    const profile = await this.farmersService.getOrCreateProfile(userId);
    await this.checkCategory(dto.categoryId);

    const product = this.productRepo.create({
      farmerId: profile.id,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      unit: dto.unit,
      pricePerUnit: dto.pricePerUnit,
      availableQuantity: dto.availableQuantity,
      minOrderQuantity: dto.minOrderQuantity ?? 1,
      harvestDate: dto.harvestDate ?? null,
      availableFrom: dto.availableFrom ?? null,
    });
    const saved = await this.productRepo.save(product);
    return this.toProductResponse(saved);
  }

  async getMyProducts(userId: string, query: MyProductsQueryDto) {
    const profile = await this.farmersService.getOrCreateProfile(userId);

    const where: FindOptionsWhere<Product> = { farmerId: profile.id };
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [products, total] = await this.productRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: products.map((product) => this.toProductResponse(product)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getMyProduct(userId: string, productId: string) {
    const product = await this.findOwnProduct(userId, productId);
    return this.toProductResponse(product);
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.findOwnProduct(userId, productId);

    if (dto.categoryId !== undefined) {
      await this.checkCategory(dto.categoryId);
    }

    const changes: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (dto[field] !== undefined) {
        changes[field] = dto[field];
      }
    }

    Object.assign(product, changes);
    const saved = await this.productRepo.save(product);
    return this.toProductResponse(saved);
  }

  async updateStock(userId: string, productId: string, dto: UpdateStockDto) {
    const product = await this.findOwnProduct(userId, productId);

    product.availableQuantity = dto.availableQuantity;

    if (product.status === ProductStatus.ACTIVE && product.availableQuantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (
      product.status === ProductStatus.OUT_OF_STOCK &&
      product.availableQuantity > 0
    ) {
      product.status = ProductStatus.ACTIVE;
    }

    const saved = await this.productRepo.save(product);
    return this.toProductResponse(saved);
  }

  async updateStatus(userId: string, productId: string, dto: UpdateStatusDto) {
    const product = await this.findOwnProduct(userId, productId);

    if (dto.status === ProductStatus.ACTIVE) {
      const profile = await this.farmersService.getOrCreateProfile(userId);
      if (!this.farmersService.isProfileComplete(profile)) {
        throw new BadRequestException(
          'Complete your farm profile (farm name and district) before publishing a product',
        );
      }
      if (product.availableQuantity <= 0) {
        throw new BadRequestException('Add stock before publishing a product');
      }
    }

    product.status = dto.status;
    const saved = await this.productRepo.save(product);
    return this.toProductResponse(saved);
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await this.findOwnProduct(userId, productId);
    await this.productRepo.softRemove(product);
    return { message: 'Product deleted successfully' };
  }

  async reserveStock(manager: EntityManager, items: StockItem[]) {
    const sortedItems = this.sortItems(items);
    const lockedById: Record<string, Product> = {};

    for (const item of sortedItems) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new ConflictException('Product not found or no longer available');
      }
      if (product.status !== ProductStatus.ACTIVE) {
        throw new ConflictException(`Product "${product.name}" is not available`);
      }
      if (item.quantity < product.minOrderQuantity) {
        throw new ConflictException(
          `Minimum order for "${product.name}" is ${product.minOrderQuantity}`,
        );
      }
      if (item.quantity > product.availableQuantity) {
        throw new ConflictException(
          `Not enough stock for "${product.name}". Available: ${product.availableQuantity}`,
        );
      }

      product.availableQuantity = this.roundQuantity(
        product.availableQuantity - item.quantity,
      );
      if (product.availableQuantity === 0) {
        product.status = ProductStatus.OUT_OF_STOCK;
      }

      lockedById[product.id] = await manager.save(product);
    }

    const result: Product[] = [];
    for (const item of items) {
      result.push(lockedById[item.productId]);
    }
    return result;
  }

  async restoreStock(manager: EntityManager, items: StockItem[]) {
    const sortedItems = this.sortItems(items);

    for (const item of sortedItems) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        withDeleted: true,
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        continue;
      }

      product.availableQuantity = this.roundQuantity(
        product.availableQuantity + item.quantity,
      );
      if (product.status === ProductStatus.OUT_OF_STOCK) {
        product.status = ProductStatus.ACTIVE;
      }

      await manager.save(product);
    }
  }

  private sortItems(items: StockItem[]) {
    return [...items].sort((a, b) => a.productId.localeCompare(b.productId));
  }

  private roundQuantity(value: number) {
    return Number(value.toFixed(3));
  }

  private async findOwnProduct(userId: string, productId: string) {
    const profile = await this.farmersService.getOrCreateProfile(userId);
    const product = await this.productRepo.findOne({
      where: { id: productId, farmerId: profile.id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async checkCategory(categoryId: string) {
    const category = await this.categoriesService.findActiveById(categoryId);
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  private toProductResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      availableQuantity: product.availableQuantity,
      minOrderQuantity: product.minOrderQuantity,
      harvestDate: product.harvestDate,
      availableFrom: product.availableFrom,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}