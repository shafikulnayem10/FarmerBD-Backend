import { IsUUID } from 'class-validator';

export class AssignTransporterDto {
  @IsUUID()
  transporterId!: string;
}
