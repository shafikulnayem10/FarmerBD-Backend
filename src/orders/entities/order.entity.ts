import {Column,CreateDateColumn,Entity,Index,JoinColumn,ManyToOne,OneToMany,PrimaryGeneratedColumn,UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { BuyerProfile } from '../../buyers/entities/buyer-profile.entity.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { FarmerProfile } from '../../farmers/entities/farmer-profile.entity.js';
import { OrderItem } from './order-item.entity.js';


@Entity('orders')
@Index(['buyerId'])
@Index(['farmerId'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', type: 'varchar', length: 30, unique: true })
  orderNumber!: string;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => BuyerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: Relation<BuyerProfile>;

  @Column({ name: 'farmer_id', type: 'uuid' })
  farmerId!: string;

  @ManyToOne(() => FarmerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmer_id' })
  farmer!: Relation<FarmerProfile>;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: Relation<OrderItem[]>;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  subtotal!: number;

  @Column({
    name: 'delivery_fee',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  deliveryFee!: number;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  totalAmount!: number;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 30,
    default: 'CASH_ON_DELIVERY',
  })
  paymentMethod!: string;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 30,
    default: 'UNPAID',
  })
  paymentStatus!: string;

  @Column({ name: 'ship_recipient_name', type: 'varchar', length: 100 })
  shipRecipientName!: string;

  @Column({ name: 'ship_phone', type: 'varchar', length: 20 })
  shipPhone!: string;

  @Column({ name: 'ship_division', type: 'varchar', length: 50 })
  shipDivision!: string;

  @Column({ name: 'ship_district', type: 'varchar', length: 50 })
  shipDistrict!: string;

  @Column({ name: 'ship_upazila', type: 'varchar', length: 100 })
  shipUpazila!: string;

  @Column({ name: 'ship_address_line', type: 'varchar', length: 255 })
  shipAddressLine!: string;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}