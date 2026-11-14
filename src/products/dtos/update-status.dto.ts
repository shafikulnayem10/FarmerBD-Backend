import { IsIn } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum.js';

export class UpdateStatusDto {
  @IsIn([ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.ARCHIVED], {
    message: 'status must be one of DRAFT, ACTIVE, ARCHIVED',
  })
  status!: ProductStatus;
}