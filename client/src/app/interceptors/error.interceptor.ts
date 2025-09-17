import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = error.error.message || 'Bad Request';
              break;
            case 401:
              errorMessage = 'Unauthorized';
              this.authService.logout();
              break;
            case 403:
              errorMessage = 'Access Denied';
              break;
            case 404:
              errorMessage = 'Resource Not Found';
              break;
            case 500:
              errorMessage = 'Internal Server Error';
              break;
            default:
              errorMessage = error.error.message || 'Something went wrong';
          }
        }
        
        // Show error message
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        
        return throwError(() => error);
      })
    );
  }
}