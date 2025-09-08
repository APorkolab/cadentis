import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  
  constructor(private securityService: SecurityService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let secureReq = req;

    // Add CSRF token to state-changing requests
    if (this.isStateChangingRequest(req.method)) {
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
    const identifier = this.getRequestIdentifier(req);
    if (!this.securityService.checkRateLimit(identifier)) {
      return throwError(() => new HttpErrorResponse({
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      }));
    }

    // Validate request URL
    if (this.securityService.detectSuspiciousActivity(req.url)) {
      return throwError(() => new HttpErrorResponse({
        error: 'Suspicious request blocked',
        status: 403,
        statusText: 'Forbidden'
      }));
    }

    return next.handle(secureReq).pipe(
      tap(event => {
        // Log successful requests for monitoring
        this.logRequestSuccess(req);
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleSecurityError(error, req);
        return throwError(() => error);
      })
    );
  }

  private isStateChangingRequest(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  private getRequestIdentifier(req: HttpRequest<any>): string {
    // Use URL path as identifier for rate limiting
    return req.url.split('?')[0];
  }

  private logRequestSuccess(req: HttpRequest<any>): void {
    // Could log successful requests for audit trail
    console.debug(`Secure request completed: ${req.method} ${req.url}`);
  }

  private handleSecurityError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    // Log security-related errors
    if (error.status === 403 || error.status === 401) {
      console.warn(`Security error for ${req.method} ${req.url}:`, error.message);
    }
  }
}
