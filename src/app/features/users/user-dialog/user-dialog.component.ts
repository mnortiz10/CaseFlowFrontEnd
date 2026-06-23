import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService, UserDto, CreateUserDto, UpdateUserDto } from '../../../core/services/user.service';
import { RoleService, RoleDto } from '../../../core/services/role.service';

export interface UserDialogData {
  user?: UserDto;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, TranslatePipe,
  ],
  templateUrl: './user-dialog.component.html',
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 0; padding-top: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .status-row { padding: 4px 0 8px; }
    .spinner-row { display: flex; justify-content: center; padding: 8px 0; }
  `],
})
export class UserDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent>);
  readonly data: UserDialogData = inject(MAT_DIALOG_DATA);

  get isEdit(): boolean { return !!this.data?.user; }

  availableRoles: RoleDto[] = [];
  loadingRoles = true;
  saving = false;
  hidePassword = true;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    roles:     [[] as string[]],
    isActive:  [true],
  });

  ngOnInit(): void {
    if (this.isEdit) {
      this.form.get('email')!.clearValidators();
      this.form.get('email')!.updateValueAndValidity();
      this.form.get('password')!.clearValidators();
      this.form.get('password')!.updateValueAndValidity();

      const u = this.data.user!;
      this.form.patchValue({
        firstName: u.firstName,
        lastName:  u.lastName,
        roles:     u.roles,
        isActive:  u.isActive,
      });
    }

    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(r => r.isActive);
        this.loadingRoles = false;
      },
      error: () => (this.loadingRoles = false),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;

    if (this.isEdit) {
      const user = this.data.user!;
      forkJoin([
        this.userService.updateUser(user.id, {
          firstName: v.firstName!,
          lastName:  v.lastName!,
          isActive:  v.isActive!,
        } as UpdateUserDto),
        this.userService.assignRoles(user.id, v.roles ?? []),
      ]).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    } else {
      this.userService.createUser({
        firstName: v.firstName!,
        lastName:  v.lastName!,
        email:     v.email!,
        password:  v.password!,
        roles:     v.roles ?? [],
      } as CreateUserDto).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    }
  }
}
