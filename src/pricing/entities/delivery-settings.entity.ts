import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';

// This table has a single row. The report lists no id column, but TypeORM
// needs a primary key, so a UUID id is added.
@Entity('delivery_settings')
@Check('"mileage_km_per_liter" > 0')
@Check('"operating_factor" > 0')
@Check('"base_fare" >= 0')
@Check('"min_fare" >= 0')
@Check('"road_distance_factor" >= 1')
export class DeliverySettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'mileage_km_per_liter',
    type: 'numeric',
    precision: 6,
    scale: 2,
    transformer: numericTransformer,
  })
  mileageKmPerLiter!: number;

  @Column({
    name: 'operating_factor',
    type: 'numeric',
    precision: 6,
    scale: 2,
    transformer: numericTransformer,
  })
  operatingFactor!: number;

  @Column({
    name: 'base_fare',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  baseFare!: number;

  @Column({
    name: 'min_fare',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  minFare!: number;

  @Column({
    name: 'road_distance_factor',
    type: 'numeric',
    precision: 4,
    scale: 2,
    transformer: numericTransformer,
  })
  roadDistanceFactor!: number;
}
