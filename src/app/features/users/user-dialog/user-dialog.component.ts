import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
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
import { TicketTypeService, TicketTypeDto } from '../../../core/services/ticket-type.service';

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
    .section-divider { border-top: 1px solid #e5e7eb; margin: 8px 0 16px; }
    .section-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; }
  `],
})
export class UserDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent>);
  readonly data: UserDialogData = inject(MAT_DIALOG_DATA);

  get isEdit(): boolean { return !!this.data?.user; }

  availableRoles: RoleDto[] = [];
  ticketTypes: TicketTypeDto[] = [];
  loadingRoles = true;
  saving = false;
  hidePassword = true;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    mustChangePassword: [false],
    roles:     [[] as string[]],
    allowedTicketTypeIds: [[] as number[]],
    isActive:  [true],
  });

  ngOnInit(): void {
    if (this.isEdit) {
      this.form.get('email')!.clearValidators();
      this.form.get('email')!.updateValueAndValidity();
      // In edit mode the password is optional: filling it resets the user's password.
      this.form.get('password')!.setValidators([Validators.minLength(8)]);
      this.form.get('password')!.updateValueAndValidity();

      const u = this.data.user!;
      this.form.patchValue({
        firstName: u.firstName,
        lastName:  u.lastName,
        roles:     u.roles,
        allowedTicketTypeIds: u.allowedTicketTypeIds ?? [],
        isActive:  u.isActive,
        mustChangePassword: u.mustChangePassword,
      });
    }

    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(r => r.isActive);
        this.loadingRoles = false;
      },
      error: () => (this.loadingRoles = false),
    });

    this.ticketTypeService.getAll().subscribe({
      next: tt => this.ticketTypes = tt.filter(t => t.isActive),
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
      const calls: Observable<unknown>[] = [
        this.userService.updateUser(user.id, {
          firstName: v.firstName!,
          lastName:  v.lastName!,
          isActive:  v.isActive!,
        } as UpdateUserDto),
        this.userService.assignRoles(user.id, v.roles ?? []),
        this.userService.assignTicketTypes(user.id, v.allowedTicketTypeIds ?? []),
      ];
      if (v.password) {
        calls.push(this.userService.resetPassword(user.id, v.password, v.mustChangePassword ?? false));
      }
      forkJoin(calls).subscribe({
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
        mustChangePassword: v.mustChangePassword ?? false,
      } as CreateUserDto).subscribe({
        next: created => {
          const typeIds = v.allowedTicketTypeIds ?? [];
          if (typeIds.length > 0) {
            this.userService.assignTicketTypes(created.id, typeIds).subscribe({
              next: () => this.dialogRef.close(true),
              error: () => this.dialogRef.close(true),
            });
          } else {
            this.dialogRef.close(true);
          }
        },
        error: () => (this.saving = false),
      });
    }
  }
}
