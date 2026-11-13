import { CallHandler, ExecutionContext, Injectable, NestInterceptor,} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        response.setHeader('X-Response-Time', `${Date.now() - startedAt}ms`);
      }),
    );
  }
}
