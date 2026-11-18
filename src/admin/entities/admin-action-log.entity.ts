import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { AdminAction } from '../../common/enums/admin-action.enum.js';
import { Users } from '../../users/entities/users.entity.js';

@Entity('admin_action_logs')
@Index(['adminId'])
@Index(['resourceType', 'resourceId'])
export class AdminActionLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId!: string;

  @ManyToOne(() => Users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  admin!: Relation<Users>;

  @Column({ type: 'enum', enum: AdminAction })
  action!: AdminAction;

  @Column({ name: 'resource_type', type: 'varchar', length: 50 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
