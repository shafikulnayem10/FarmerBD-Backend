import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('farmer_profiles')
export class FarmerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Users>;

  @Column({ name: 'farm_name', type: 'varchar', length: 100, nullable: true })
  farmName!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  division!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  district!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upazila!: string | null;

  @Column({ name: 'address_line', type: 'varchar', length: 255, nullable: true })
  addressLine!: string | null;

  @Column({
    name: 'farm_size_acres',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  farmSizeAcres!: number | null;

  @Column({
    name: 'primary_crops',
    type: 'text',
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  primaryCrops!: string[];

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}