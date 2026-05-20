import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    // Bypass interceptor for root, health status, and Swagger docs
    if (
      request.url === '/' ||
      request.url === '/health' ||
      request.url.startsWith('/api')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data already has a 'success' field or is undefined/null, handle gracefully
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}
