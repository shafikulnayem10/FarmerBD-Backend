import { Transform } from 'class-transformer';
import {IsEmail,IsIn,IsNotEmpty,IsString,Matches,MaxLength,} from 'class-validator';
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
  typeof value === 'string' ? value.trim() : value,
  )
  phone!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsIn([Role.FARMER, Role.BUYER, Role.TRANSPORTER], {
    message: 'role must be one of FARMER, BUYER, TRANSPORTER',
  })
  role!: Role;
}