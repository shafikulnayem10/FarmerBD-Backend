import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { StockChangeReason } from '../../common/enums/stock-change-reason.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Users } from '../../users/entities/users.entity.js';
import { Product } from './product.entity.js';

@Entity('stock_adjustments')
@Index(['productId', 'createdAt'])
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<Product>;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  changer!: Relation<Users> | null;

  @Column({
    name: 'old_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  oldQuantity!: number;

  @Column({
    name: 'new_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  newQuantity!: number;

  @Column({ type: 'enum', enum: StockChangeReason })
  reason!: StockChangeReason;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
