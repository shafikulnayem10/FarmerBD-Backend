import {CreateDateColumn,Column, Entity,JoinColumn,OneToOne,PrimaryGeneratedColumn,UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { BuyerProfile } from '../../buyers/entities/buyer-profile.entity.js';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'buyer_id', type: 'uuid', unique: true })
  buyerId!: string;

  @OneToOne(() => BuyerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: Relation<BuyerProfile>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}