import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum.js';
import { trim } from '../../common/transformers/trim.transformer.js';

export class ModerateProductDto {
  @IsIn([ProductStatus.DRAFT, ProductStatus.ARCHIVED], {
    message: 'status must be one of DRAFT, ARCHIVED',
  })
  status!: ProductStatus;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
