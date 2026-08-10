import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatProgressSpinnerModule,
    TranslatePipe,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <mat-card class="w-full max-w-md p-6">
        <div class="flex items-center gap-2 mb-1">
          <mat-icon class="text-blue-600">lock_reset</mat-icon>
          <h1 class="text-xl font-semibold">{{ 'AUTH.CHANGE_PASSWORD.TITLE' | translate }}</h1>
        </div>
        <p class="text-sm text-gray-500 mb-5">{{ 'AUTH.CHANGE_PASSWORD.SUBTITLE' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'AUTH.CHANGE_PASSWORD.CURRENT' | translate }}</mat-label>
            <input matInput [type]="hideCurrent ? 'password' : 'text'" formControlName="currentPassword" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button" (click)="hideCurrent = !hideCurrent">
              <mat-icon>{{ hideCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'AUTH.CHANGE_PASSWORD.NEW' | translate }}</mat-label>
            <input matInput [type]="hideNew ? 'password' : 'text'" formControlName="newPassword" autocomplete="new-password">
            <button mat-icon-button matSuffix type="button" (click)="hideNew = !hideNew">
              <mat-icon>{{ hideNew ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('newPassword')?.hasError('minlength')) {
              <mat-error>{{ 'AUTH.CHANGE_PASSWORD.MIN_LENGTH' | translate }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'AUTH.CHANGE_PASSWORD.CONFIRM' | translate }}</mat-label>
            <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
            @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
              <mat-error>{{ 'AUTH.CHANGE_PASSWORD.MISMATCH' | translate }}</mat-error>
            }
          </mat-form-field>

          @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
            <p class="text-red-600 text-sm mb-2">{{ 'AUTH.CHANGE_PASSWORD.MISMATCH' | translate }}</p>
          }
          @if (error) {
            <p class="text-red-600 text-sm mb-2">{{ error }}</p>
          }

          <button mat-flat-button color="primary" type="submit" [disabled]="loading" class="mt-2">
            @if (loading) {
              <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
            }
            {{ 'AUTH.CHANGE_PASSWORD.SUBMIT' | translate }}
          </button>
          <button mat-button type="button" class="mt-1" (click)="logout()">
            {{ 'AUTH.CHANGE_PASSWORD.LOGOUT' | translate }}
          </button>
        </form>
      </mat-card>
    </div>
  `,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = false;
  error = '';
  hideCurrent = true;
  hideNew = true;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchPasswords });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const v = this.form.value;
    this.auth.changePassword(v.currentPassword!, v.newPassword!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error = err.error?.error || this.translate.instant('AUTH.CHANGE_PASSWORD.ERROR');
        this.loading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
