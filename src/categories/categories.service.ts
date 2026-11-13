import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';

const DEFAULT_CATEGORIES = [
  { name: 'Rice and Grains', slug: 'rice-and-grains' },
  { name: 'Vegetables', slug: 'vegetables' },
  { name: 'Fruits', slug: 'fruits' },
  { name: 'Pulses', slug: 'pulses' },
  { name: 'Spices', slug: 'spices' },
  { name: 'Oilseeds', slug: 'oilseeds' },
  { name: 'Potato and Tubers', slug: 'potato-and-tubers' },
  { name: 'Jute and Fibre', slug: 'jute-and-fibre' },
  { name: 'Others', slug: 'others' },
];

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async onApplicationBootstrap() {
    const total = await this.categoryRepo.count();
    if (total === 0) {
      await this.categoryRepo.save(DEFAULT_CATEGORIES);
    }
  }

  async findAllActive() {
    return await this.categoryRepo.find({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      order: { name: 'ASC' },
    });
  }

  async findActiveById(id: string) {
    return await this.categoryRepo.findOne({ where: { id, isActive: true } });
  }
}