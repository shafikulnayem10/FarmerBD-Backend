import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestMetaData } from '../common/interfaces/request-meta.interface.js';
import { AuditLog } from './entities/audit-log.entity.js';

export interface AuditLogInput {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  meta?: RequestMetaData;
}


function removeSensitiveFields(value?: Record<string, unknown> | null) {
  if (!value) {
    return null;
  }

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(value)) {
    const lowerKey = key.toLowerCase();

    if (!lowerKey.includes('password') &&!lowerKey.includes('token') &&!lowerKey.includes('secret')) {
      result[key] = value[key];
    }
  }

  return result;
}
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      const auditLog = this.auditRepo.create({
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldValue: removeSensitiveFields(input.oldValue),
        newValue: removeSensitiveFields(input.newValue),
        ipAddress: input.meta?.ipAddress ?? null,
        requestId: input.meta?.requestId ?? null,
      });
      await this.auditRepo.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to write audit log (${input.action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}