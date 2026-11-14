import {
   Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BuyerProfile } from './buyer-profile.entity.js';

@Entity('delivery_addresses')
@Index(['buyerId'])
export class DeliveryAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => BuyerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: Relation<BuyerProfile>;

  @Column({ type: 'varchar', length: 50 })
  label!: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100 })
  recipientName!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 50 })
  division!: string;

  @Column({ type: 'varchar', length: 50 })
  district!: string;

  @Column({ type: 'varchar', length: 100 })
  upazila!: string;

  @Column({ name: 'address_line', type: 'varchar', length: 255 })
  addressLine!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}