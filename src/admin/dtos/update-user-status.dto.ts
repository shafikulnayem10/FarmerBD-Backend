import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;

  // A reason is required when suspending, optional when reactivating.
  @ValidateIf(
    (dto: UpdateUserStatusDto) =>
      dto.status === UserStatus.SUSPENDED || dto.reason !== undefined,
  )
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
