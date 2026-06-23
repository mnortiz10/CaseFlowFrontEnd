import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { RoleService, RoleDto, CreateRoleDto, UpdateRoleDto } from '../../../core/services/role.service';

export interface RoleDialogData {
  role?: RoleDto;
}

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatButtonModule, MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './role-dialog.component.html',
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 0; padding-top: 4px; }
    mat-form-field { width: 100%; }
    .status-row { padding: 4px 0 8px; }
  `],
})
export class RoleDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<RoleDialogComponent>);
  readonly data: RoleDialogData = inject(MAT_DIALOG_DATA);

  get isEdit(): boolean { return !!this.data?.role; }

  saving = false;

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    isActive:    [true],
  });

  ngOnInit(): void {
    if (this.isEdit) {
      const r = this.data.role!;
      this.form.patchValue({
        name:        r.name,
        description: r.description,
        isActive:    r.isActive,
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;

    if (this.isEdit) {
      this.roleService.updateRole(this.data.role!.id, {
        name:        v.name!,
        description: v.description ?? '',
        isActive:    v.isActive!,
      } as UpdateRoleDto).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    } else {
      this.roleService.createRole({
        name:        v.name!,
        description: v.description ?? '',
      } as CreateRoleDto).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    }
  }
}
