import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { AdminActionLog } from './entities/admin-action-log.entity.js';

@Injectable()
export class AdminLogsService {
  // Saved with the same manager as the change, so the log and the change
  // are committed or rolled back together.
  async log(
    manager: EntityManager,
    adminId: string,
    action: AdminAction,
    resourceType: string,
    resourceId: string,
    reason?: string | null,
  ) {
    const log = manager.create(AdminActionLog, {
      adminId,
      action,
      resourceType,
      resourceId,
      reason: reason ?? null,
    });
    await manager.save(log);
  }
}
