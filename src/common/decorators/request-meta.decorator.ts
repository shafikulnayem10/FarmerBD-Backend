import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestMetaData } from '../interfaces/request-meta.interface.js';

export const RequestMeta = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestMetaData => {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'];

    return {
      ipAddress: request.ip ?? null,
      requestId: typeof requestId === 'string' ? requestId : null,
    };
  },
);