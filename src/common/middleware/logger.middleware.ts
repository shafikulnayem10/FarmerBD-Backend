import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const requestId = String(request.headers['x-request-id']);
      this.logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms [${requestId}]`,
      );
    });

    next();
  }
}