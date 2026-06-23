import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatChipsModule, MatDividerModule, TranslatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly auth = inject(AuthService);

  profileForm = this.fb.group({
    firstName: [this.auth.currentUser?.firstName ?? ''],
    lastName: [this.auth.currentUser?.lastName ?? ''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  get initials(): string {
    const u = this.auth.currentUser;
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  saveProfile(): void {
    this.snackBar.open(
      this.translate.instant('PROFILE.TOAST.SAVED'),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 2500 }
    );
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.snackBar.open(
      this.translate.instant('PROFILE.TOAST.PASSWORD_CHANGED'),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 2500 }
    );
    this.passwordForm.reset();
  }
}
