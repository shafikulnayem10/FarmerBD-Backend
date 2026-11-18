import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Notification } from './entities/notification.entity.js';

export interface NewNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
}

@Injectable()
export class NotificationsService {
  // The manager is passed in so the notification is saved in the same
  // transaction as the change it reports.
  async notify(manager: EntityManager, data: NewNotification) {
    const notification = manager.create(Notification, {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
    });
    return await manager.save(notification);
  }
}
