import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NotificationService } from './notification.service';
import { LoggingService } from './services/logging.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface ErrorContext {
  message: string;
  url?: string;
  userId?: string;
  userAgent: string;
  timestamp: Date;
  stack?: string;
  component?: string;
  action?: string;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorCount = 0;
  private maxErrorsBeforeReload = 10;
  private errorTimeWindow = 60000; // 1 minute
  private recentErrors: Date[] = [];

  constructor(private injector: Injector) {}

  handleError(error: Error | unknown): void {
    try {
      const loggingService = this.injector.get(LoggingService);
      const notificationService = this.injector.get(NotificationService);
      const router = this.injector.get(Router);

      // Extract error information
      const errorInfo = this.extractErrorInfo(error);
      
      // Track error frequency
      this.trackErrorFrequency();
      
      // Log detailed error information
      loggingService.fatal('Global error occurred', {
        error: errorInfo,
        errorCount: this.errorCount,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }, 'GlobalErrorHandler');

      // Determine user-friendly message
      const userMessage = this.getUserFriendlyMessage(error);
      
      // Show notification to user
      notificationService.showError(userMessage, {
        duration: 8000,
        panelClass: ['critical-error-snackbar']
      });

      // Error recovery strategies
      this.attemptErrorRecovery(error, router, notificationService);

      // Report to external services in production
      if (environment.production && environment.errorReporting.enabled) {
        this.reportToExternalService(errorInfo);
      }

    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error('Error in GlobalErrorHandler:', handlerError);
      console.error('Original error:', error);
      
      // Show basic browser alert as last resort
      if (environment.developmentMode) {
        alert('Critical error occurred. Check console for details.');
      }
    }
  }

  private extractErrorInfo(error: unknown): ErrorContext {
    const errorContext: ErrorContext = {
      message: 'Unknown error',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    if (error instanceof Error) {
      errorContext.message = error.message;
      errorContext.stack = error.stack;
    } else if (typeof error === 'string') {
      errorContext.message = error;
    } else if (error && typeof error === 'object') {
      errorContext.message = JSON.stringify(error);
    }

    return errorContext;
  }

  private getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      // Map specific errors to user-friendly messages
      if (error.message.includes('ChunkLoadError')) {
        return 'The application has been updated. Please refresh the page.';
      }
      
      if (error.message.includes('Network')) {
        return 'Network connection lost. Please check your internet connection.';
      }
      
      if (error.message.includes('Permission')) {
        return 'Permission denied. Please contact support if this persists.';
      }
    }

    return 'An unexpected error occurred. The development team has been notified.';
  }

  private trackErrorFrequency(): void {
    const now = new Date();
    this.errorCount++;
    
    // Clean old errors outside the time window
    this.recentErrors = this.recentErrors.filter(
      errorTime => now.getTime() - errorTime.getTime() < this.errorTimeWindow
    );
    
    this.recentErrors.push(now);
    
    // Check if we've exceeded error threshold
    if (this.recentErrors.length >= this.maxErrorsBeforeReload) {
      this.handleExcessiveErrors();
    }
  }

  private attemptErrorRecovery(error: unknown, router: Router, notificationService: NotificationService): void {
    if (error instanceof Error) {
      // Handle specific error types with recovery strategies
      if (error.message.includes('ChunkLoadError')) {
        // Offer to reload the page
        const persistent = notificationService.showPersistent(
          'Application update detected. Click to reload.',
          'warning',
          [{ text: 'Reload', action: () => (window as any).location.reload() }]
        );
        return;
      }
      
      if (error.message.includes('Route')) {
        // Navigate to safe route
        router.navigate(['/']);
        return;
      }
    }
  }

  private handleExcessiveErrors(): void {
    const loggingService = this.injector.get(LoggingService);
    const notificationService = this.injector.get(NotificationService);
    
    loggingService.fatal('Excessive errors detected', {
      errorCount: this.errorCount,
      recentErrorsCount: this.recentErrors.length,
      timeWindow: this.errorTimeWindow
    });
    
    notificationService.showPersistent(
      'Multiple errors detected. The application may be unstable.',
      'error',
      [
        { text: 'Reload App', action: () => (window as any).location.reload() },
        { text: 'Clear Cache', action: () => this.clearCacheAndReload() }
      ]
    );
  }

  private clearCacheAndReload(): void {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).finally(() => {
        (window as any).location.reload();
      });
    } else {
      (window as any).location.reload();
    }
  }

  private reportToExternalService(errorContext: ErrorContext): void {
    // Implement integration with error reporting services like Sentry
    try {
      // Example: Send to custom error reporting endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorContext,
          environment: environment.production ? 'production' : 'development',
          version: environment.version
        })
      }).catch(reportError => {
        console.error('Failed to report error to external service:', reportError);
      });
    } catch (reportError) {
      console.error('Error reporting to external service:', reportError);
    }
  }
}
