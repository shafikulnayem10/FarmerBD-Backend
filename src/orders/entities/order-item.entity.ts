import {Column,Entity,Index,JoinColumn,ManyToOne,PrimaryGeneratedColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductUnit } from '../../common/enums/product-unit.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Product } from '../../products/entities/product.entity.js';
import { Order } from './order.entity.js';

@Entity('order_items')
@Index(['orderId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Relation<Order>;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<Product>;

  @Column({ name: 'product_name', type: 'varchar', length: 150 })
  productName!: string;

  @Column({ type: 'enum', enum: ProductUnit })
  unit!: ProductUnit;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  unitPrice!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  quantity!: number;

  @Column({
    name: 'line_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  lineTotal!: number;
}