import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any): void {
    const notificationService = this.injector.get(NotificationService);
    const errorMessage = 'An unexpected error occurred. Please try again.';

    // Log the full error to the console for developers
    console.error('GlobalErrorHandler caught an error:', error);

    // Show a user-friendly message
    notificationService.showError(errorMessage);
  }
}
