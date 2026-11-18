import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';

// The district name is unique, so it is used as the primary key.
@Entity('district_locations')
export class DistrictLocation {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  district!: string;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    transformer: numericTransformer,
  })
  latitude!: number;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    transformer: numericTransformer,
  })
  longitude!: number;
}
