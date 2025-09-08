import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      let shouldShowNotification = true;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = 'Bad Request: Please check your input';
            break;
          case 401:
            errorMessage = 'Unauthorized: Please log in';
            break;
          case 403:
            errorMessage = 'Forbidden: Access denied';
            break;
          case 404:
            errorMessage = 'Not Found: The requested resource was not found';
            shouldShowNotification = false; // Don't show notification for 404s
            break;
          case 429:
            errorMessage = 'Too Many Requests: Please wait before trying again';
            break;
          case 500:
            errorMessage = 'Server Error: Please try again later';
            break;
          case 503:
            errorMessage = 'Service Unavailable: The service is temporarily down';
            break;
          default:
            errorMessage = `HTTP Error ${error.status}: ${error.message}`;
        }
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        url: req.url,
        method: req.method,
        status: error.status,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      // Show user notification for appropriate errors
      if (shouldShowNotification && error.status !== 0) { // Don't show for network errors
        notificationService.showError(errorMessage, {
          duration: error.status >= 500 ? 8000 : 5000
        });
      }

      // Create enhanced error object
      const enhancedError = {
        ...error,
        userMessage: errorMessage,
        timestamp: new Date().toISOString(),
        requestUrl: req.url,
        requestMethod: req.method
      };

      return throwError(() => enhancedError);
    })
  );
};
