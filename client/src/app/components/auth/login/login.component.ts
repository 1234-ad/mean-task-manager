import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Initialize socket connection
          this.socketService.connect();
          
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (control?.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    
    return '';
  }
}