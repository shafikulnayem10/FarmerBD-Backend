import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { BD_DISTRICTS } from '../../common/constants/bd-locations.js';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto.js';
import { Availability } from '../../common/enums/availability.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';

export class AdminTransportersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsIn(BD_DISTRICTS, { message: 'district must be a valid Bangladesh district' })
  district?: string;

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;
}
