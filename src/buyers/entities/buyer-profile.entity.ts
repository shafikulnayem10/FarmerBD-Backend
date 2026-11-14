import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BuyerType } from '../../common/enums/buyer-type.enum.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('buyer_profiles')
export class BuyerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Users>;

  @Column({
    name: 'buyer_type',
    type: 'enum',
    enum: BuyerType,
    default: BuyerType.INDIVIDUAL,
  })
  buyerType!: BuyerType;

  @Column({ name: 'business_name', type: 'varchar', length: 100, nullable: true })
  businessName!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}