import { IsNumber, Max, Min } from 'class-validator';

export class UpdateStockDto {
  @IsNumber()
  @Min(0)
  @Max(1000000)
  availableQuantity!: number;
}