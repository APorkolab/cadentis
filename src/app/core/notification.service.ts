import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000, // 5 seconds
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'] // For custom styling
    });
  }
}
