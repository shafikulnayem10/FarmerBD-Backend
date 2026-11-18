import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Order } from '../../orders/entities/order.entity.js';
import { TransporterProfile } from '../../transporters/entities/transporter-profile.entity.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('deliveries')
@Index(['transporterId'])
@Index(['status'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @OneToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: Relation<Order>;

  @Column({ name: 'transporter_id', type: 'uuid' })
  transporterId!: string;

  @ManyToOne(() => TransporterProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transporter_id' })
  transporter!: Relation<TransporterProfile>;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.ASSIGNED })
  status!: DeliveryStatus;

  @Column({ name: 'pickup_district', type: 'varchar', length: 50 })
  pickupDistrict!: string;

  @Column({ name: 'drop_district', type: 'varchar', length: 50 })
  dropDistrict!: string;

  @Column({
    name: 'distance_km',
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  distanceKm!: number;

  @Column({
    name: 'fuel_price_snapshot',
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  fuelPriceSnapshot!: number;

  @Column({
    name: 'fare_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  fareAmount!: number;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy!: string | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assigner!: Relation<Users> | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt!: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
