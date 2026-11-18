import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { Availability } from '../../common/enums/availability.enum.js';
import { VehicleType } from '../../common/enums/vehicle-type.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('transporter_profiles')
@Check('"capacity_kg" > 0')
export class TransporterProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Users>;

  @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType })
  vehicleType!: VehicleType;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 30, unique: true })
  vehicleNumber!: string;

  @Column({
    name: 'capacity_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  capacityKg!: number;

  @Column({ name: 'license_number', type: 'varchar', length: 30, unique: true })
  licenseNumber!: string;

  @Column({ name: 'base_district', type: 'varchar', length: 50 })
  baseDistrict!: string;

  @Column({
    name: 'service_districts',
    type: 'text',
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  serviceDistricts!: string[];

  @Column({ type: 'enum', enum: Availability, default: Availability.AVAILABLE })
  availability!: Availability;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy!: string | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier!: Relation<Users> | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
