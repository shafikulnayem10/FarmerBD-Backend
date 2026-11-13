import {Column,CreateDateColumn,Entity,Index,PrimaryGeneratedColumn,} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 20, nullable: true })
  actorRole!: string | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 100, nullable: true })
  entityId!: string | null;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue!: Record<string, unknown> | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue!: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId!: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}