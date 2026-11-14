import {Check,Column,CreateDateColumn,DeleteDateColumn,Entity,Index,JoinColumn,ManyToOne,OneToMany,PrimaryGeneratedColumn,UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import { ProductStatus } from '../../common/enums/product-status.enum.js';
import { ProductUnit } from '../../common/enums/product-unit.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { FarmerProfile } from '../../farmers/entities/farmer-profile.entity.js';
import { ProductImage } from './product-image.entity.js';

@Entity('products')
@Check('"price_per_unit" > 0')
@Check('"available_quantity" >= 0')
@Check('"min_order_quantity" > 0')
@Index(['farmerId'])
@Index(['status', 'categoryId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'farmer_id', type: 'uuid' })
  farmerId!: string;

  @ManyToOne(() => FarmerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmer_id' })
  farmer!: Relation<FarmerProfile>;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Relation<Category>;

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: Relation<ProductImage[]>;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ProductUnit })
  unit!: ProductUnit;

  @Column({
    name: 'price_per_unit',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  pricePerUnit!: number;

  @Column({
    name: 'available_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  availableQuantity!: number;

  @Column({
    name: 'min_order_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 1,
    transformer: numericTransformer,
  })
  minOrderQuantity!: number;

  @Column({ name: 'harvest_date', type: 'date', nullable: true })
  harvestDate!: string | null;

  @Column({ name: 'available_from', type: 'date', nullable: true })
  availableFrom!: string | null;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}