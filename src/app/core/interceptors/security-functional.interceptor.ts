import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

export const securityInterceptor: HttpInterceptorFn = (req, next) => {
  const securityService = inject(SecurityService);
  
  let secureReq = req;

  // Add CSRF token to state-changing requests
  if (isStateChangingRequest(req.method)) {
    const csrfToken = sessionStorage.getItem('csrf-token');
    if (csrfToken) {
      secureReq = req.clone({
        setHeaders: {
          'X-CSRF-Token': csrfToken
        }
      });
    }
  }

  // Add security headers
  secureReq = secureReq.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  // Check rate limiting
  const identifier = getRequestIdentifier(req);
  if (!securityService.checkRateLimit(identifier)) {
    return throwError(() => new HttpErrorResponse({
      error: 'Rate limit exceeded',
      status: 429,
      statusText: 'Too Many Requests'
    }));
  }

  // Validate request URL
  if (securityService.detectSuspiciousActivity(req.url)) {
    return throwError(() => new HttpErrorResponse({
      error: 'Suspicious request blocked',
      status: 403,
      statusText: 'Forbidden'
    }));
  }

  return next(secureReq).pipe(
    tap(() => {
      // Log successful requests for monitoring
      console.debug(`Secure request completed: ${req.method} ${req.url}`);
    }),
    catchError((error: HttpErrorResponse) => {
      // Log security-related errors
      if (error.status === 403 || error.status === 401) {
        console.warn(`Security error for ${req.method} ${req.url}:`, error.message);
      }
      return throwError(() => error);
    })
  );
};

function isStateChangingRequest(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function getRequestIdentifier(req: any): string {
  // Use URL path as identifier for rate limiting
  return req.url.split('?')[0];
}
