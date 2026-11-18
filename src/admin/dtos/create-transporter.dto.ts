import { Transform } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsEmail, IsEnum, IsIn, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, Min,} from 'class-validator';
import { BD_DISTRICTS } from '../../common/constants/bd-locations.js';
import { PASSWORD_MESSAGE, PASSWORD_REGEX, PHONE_MESSAGE, PHONE_REGEX,} from '../../common/constants/validation.constants.js';
import { VehicleType } from '../../common/enums/vehicle-type.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

const DISTRICT_MESSAGE = 'must be a valid Bangladesh district';

export class CreateTransporterDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/^\+88/, '') : value,
  )
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone!: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  vehicleNumber!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100000)
  capacityKg!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  licenseNumber!: string;

  @IsIn(BD_DISTRICTS, { message: `baseDistrict ${DISTRICT_MESSAGE}` })
  baseDistrict!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(BD_DISTRICTS, { each: true, message: `each serviceDistrict ${DISTRICT_MESSAGE}` })
  serviceDistricts!: string[];
}
