import { Role } from '../../common/enums/role.enum.js';

export class CreateUserDto {
  fullName!: string;
  email!: string;
  phone!: string;
  password!: string;
  role!: Role;
}