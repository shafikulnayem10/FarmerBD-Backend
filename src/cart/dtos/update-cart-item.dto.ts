import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(1000000)
  quantity!: number;
}