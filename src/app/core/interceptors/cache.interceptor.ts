import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpCacheService } from '../services/http-cache.service';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const httpCacheService = inject(HttpCacheService);

  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Skip caching for certain URLs
  const skipCache = req.headers.has('X-Skip-Cache') ||
                    req.url.includes('/api/realtime') ||
                    req.url.includes('/api/stream');

  if (skipCache) {
    return next(req);
  }

  // Check if we have a cached response
  const cachedResponse = httpCacheService.get(req);
  if (cachedResponse) {
    return of(cachedResponse);
  }

  // Make the request and cache the response
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        httpCacheService.put(req, event);
      }
    })
  );
};
