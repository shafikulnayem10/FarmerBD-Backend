import { IsDateString, IsEnum, IsNumber, Max, Min } from 'class-validator';
import { FuelType } from '../../common/enums/fuel-type.enum.js';

export class CreateFuelPriceDto {
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000)
  pricePerLiter!: number;

  @IsDateString({ strict: true })
  effectiveFrom!: string;
}
