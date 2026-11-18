import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class VerificationDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED], {
    message: 'status must be one of VERIFIED, REJECTED',
  })
  status!: VerificationStatus;

  @ValidateIf(
    (dto: VerificationDto) =>
      dto.status === VerificationStatus.REJECTED || dto.reason !== undefined,
  )
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
