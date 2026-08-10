import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error = '';
  hidePassword = true;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('expired')) {
      this.error = this.translate.instant('AUTH.ERRORS.SESSION_EXPIRED');
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { identifier, password } = this.form.value;
    this.auth.login(identifier!, password!).subscribe({
      next: res => this.router.navigate([res.user.mustChangePassword ? '/change-password' : '/dashboard']),
      error: (err) => {
        if (err.status === 404) {
          this.error = this.translate.instant('AUTH.ERRORS.USER_NOT_FOUND');
        } else if (err.status === 401) {
          this.error = this.translate.instant('AUTH.ERRORS.WRONG_PASSWORD');
        } else {
          this.error = err.error?.error || this.translate.instant('AUTH.ERRORS.GENERIC');
        }
        this.loading = false;
      },
    });
  }
}
