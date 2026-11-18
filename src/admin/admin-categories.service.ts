import { BadRequestException, ConflictException, Injectable, NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Raw, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { Product } from '../products/entities/product.entity.js';
import { AdminLogsService } from './admin-logs.service.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';

@Injectable()
export class AdminCategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async getAll() {
    return await this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async create(adminId: string, dto: CreateCategoryDto) {
    return await this.dataSource.transaction(async (manager) => {
      const slug = this.toSlug(dto.name);
      await this.checkUnique(manager, dto.name, slug);

      const category = await manager.save(
        manager.create(Category, { name: dto.name, slug }),
      );
      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.CATEGORY_CHANGE,
        'CATEGORY',
        category.id,
        `Created "${category.name}"`,
      );
      return category;
    });
  }

  async update(adminId: string, categoryId: string, dto: UpdateCategoryDto) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await this.findCategory(manager, categoryId);
      const changes: string[] = [];

      if (dto.name !== undefined && dto.name !== category.name) {
        const slug = this.toSlug(dto.name);
        await this.checkUnique(manager, dto.name, slug, category.id);
        changes.push(`Renamed "${category.name}" to "${dto.name}"`);
        category.name = dto.name;
        category.slug = slug;
      }
      if (dto.isActive !== undefined && dto.isActive !== category.isActive) {
        changes.push(dto.isActive ? 'Activated' : 'Deactivated');
        category.isActive = dto.isActive;
      }

      if (changes.length === 0) {
        return category;
      }

      const saved = await manager.save(category);
      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.CATEGORY_CHANGE,
        'CATEGORY',
        category.id,
        changes.join('; '),
      );
      return saved;
    });
  }

 
  async delete(adminId: string, categoryId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await this.findCategory(manager, categoryId);

      const used = await manager.count(Product, {
        where: { categoryId: category.id },
        withDeleted: true,
      });
      if (used > 0) {
        throw new ConflictException(
          'This category is used by products. Deactivate it instead.',
        );
      }

      await manager.remove(category);
      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.CATEGORY_CHANGE,
        'CATEGORY',
        categoryId,
        `Deleted "${category.name}"`,
      );
      return { message: 'Category deleted successfully' };
    });
  }

  private async findCategory(manager: EntityManager, categoryId: string) {
    const category = await manager.findOne(Category, {
      where: { id: categoryId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async checkUnique(
    manager: EntityManager,
    name: string,
    slug: string,
    exceptId?: string,
  ) {
    const idFilter = exceptId ? { id: Not(exceptId) } : {};
    const existing = await manager.findOne(Category, {
      where: [
        {
          ...idFilter,
          name: Raw((alias) => `LOWER(${alias}) = LOWER(:name)`, { name }),
        },
        { ...idFilter, slug },
      ],
    });
    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }
  }

  private toSlug(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) {
      throw new BadRequestException(
        'name must contain at least one English letter or number',
      );
    }
    return slug;
  }
}
