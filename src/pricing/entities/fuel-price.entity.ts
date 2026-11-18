import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,} from 'typeorm';
import type { Relation } from 'typeorm';
import { FuelType } from '../../common/enums/fuel-type.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('fuel_prices')
@Unique(['fuelType', 'effectiveFrom'])
@Check('"price_per_liter" > 0')
export class FuelPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fuel_type', type: 'enum', enum: FuelType })
  fuelType!: FuelType;

  @Column({
    name: 'price_per_liter',
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  pricePerLiter!: number;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator!: Relation<Users> | null;
}
