import { Transform } from 'class-transformer';
import {IsEmail,IsIn,IsNotEmpty,IsString,Matches,MaxLength,} from 'class-validator';
import {PASSWORD_MESSAGE,PASSWORD_REGEX,PHONE_MESSAGE,PHONE_REGEX,} from '../../common/constants/validation.constants.js';
import { Role } from '../../common/enums/role.enum.js';

export class RegisterDto {
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

  @IsIn([Role.FARMER, Role.BUYER, Role.TRANSPORTER], {
    message: 'role must be one of FARMER, BUYER, TRANSPORTER',
  })
  role!: Role;
}