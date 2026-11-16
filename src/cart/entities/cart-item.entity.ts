import {Column,CreateDateColumn,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn,Unique,} from 'typeorm';
import type { Relation } from 'typeorm';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Product } from '../../products/entities/product.entity.js';
import { Cart } from './cart.entity.js';

@Entity('cart_items')
@Unique(['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @ManyToOne(() => Cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Relation<Cart>;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<Product>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}