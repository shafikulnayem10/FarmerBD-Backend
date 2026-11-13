import { Transform } from 'class-transformer';
import {ArrayMaxSize,IsArray,IsIn,IsNumber,IsOptional,IsString,Max,MaxLength,Min,MinLength,} from 'class-validator';
import {BD_DISTRICTS,BD_DIVISIONS,} from '../../common/constants/bd-locations.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateFarmerProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  farmName?: string;

  @IsOptional()
  @IsIn(BD_DIVISIONS, { message: 'division must be a valid Bangladesh division' })
  division?: string;

  @IsOptional()
  @IsIn(BD_DISTRICTS, { message: 'district must be a valid Bangladesh district' })
  district?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  upazila?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  addressLine?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  farmSizeAcres?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  primaryCrops?: string[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  bio?: string;
}