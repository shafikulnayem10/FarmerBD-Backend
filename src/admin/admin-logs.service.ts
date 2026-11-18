import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { AdminActionLog } from './entities/admin-action-log.entity.js';

@Injectable()
export class AdminLogsService {
  
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
