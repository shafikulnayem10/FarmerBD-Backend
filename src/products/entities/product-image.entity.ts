import {Column,CreateDateColumn,Entity,Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { Product } from './product.entity.js';

@Entity('product_images')
@Index(['productId'])
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<Product>;

  @Column({ type: 'varchar', length: 255 })
  url!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}