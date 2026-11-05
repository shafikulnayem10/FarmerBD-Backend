import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {PASSWORD_MESSAGE,PASSWORD_REGEX,} from '../../common/constants/validation.constants.js';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}