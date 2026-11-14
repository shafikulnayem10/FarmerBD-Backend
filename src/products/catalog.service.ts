import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Between,FindOptionsOrder,FindOptionsWhere,ILike,In,LessThanOrEqual,MoreThanOrEqual,Repository,} from 'typeorm';
import { ProductStatus } from '../common/enums/product-status.enum.js';
import { PublicProductsQueryDto } from './dtos/public-products-query.dto.js';
import { Product } from './entities/product.entity.js';

const VISIBLE_STATUSES = [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK];

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query: PublicProductsQueryDto) {
    const { minPrice, maxPrice } = query;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const where: FindOptionsWhere<Product> = {
      status: query.inStock ? ProductStatus.ACTIVE : In(VISIBLE_STATUSES),
    };
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.district) {
      where.farmer = { district: query.district };
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.pricePerUnit = Between(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      where.pricePerUnit = MoreThanOrEqual(minPrice);
    } else if (maxPrice !== undefined) {
      where.pricePerUnit = LessThanOrEqual(maxPrice);
    }

    let order: FindOptionsOrder<Product> = { createdAt: 'DESC' };
    if (query.sort === 'price_asc') {
      order = { pricePerUnit: 'ASC' };
    } else if (query.sort === 'price_desc') {
      order = { pricePerUnit: 'DESC' };
    }

    const [products, total] = await this.productRepo.findAndCount({
      where,
      relations: { farmer: true, category: true, images: true },
      order,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: products.map((product) => this.toPublicResponse(product)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({
      where: { id, status: In(VISIBLE_STATUSES) },
      relations: { farmer: true, category: true, images: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const priceComparison = await this.getPriceComparison(product);
    return { ...this.toPublicResponse(product), priceComparison };
  }

  private async getPriceComparison(product: Product) {
    const where: FindOptionsWhere<Product> = {
      categoryId: product.categoryId,
      unit: product.unit,
      status: ProductStatus.ACTIVE,
    };

    const listingCount = await this.productRepo.count({ where });
    if (listingCount < 2) {
      return { averagePrice: null, listingCount };
    }

    const average = await this.productRepo.average('pricePerUnit', where);
    return {
      averagePrice: average === null ? null : Math.round(average * 100) / 100,
      listingCount,
    };
  }

  private toPublicResponse(product: Product) {
    const images = [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({ id: image.id, url: image.url }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      availableQuantity: product.availableQuantity,
      minOrderQuantity: product.minOrderQuantity,
      harvestDate: product.harvestDate,
      availableFrom: product.availableFrom,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      farmer: {
        id: product.farmer.id,
        farmName: product.farmer.farmName,
        district: product.farmer.district,
        upazila: product.farmer.upazila,
        verificationStatus: product.farmer.verificationStatus,
      },
      images,
    };
  }
}