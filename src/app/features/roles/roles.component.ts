import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RoleService, RoleDto } from '../../core/services/role.service';
import { PermissionService, PermissionGroupDto } from '../../core/services/permission.service';
import { RoleDialogComponent } from './role-dialog/role-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatCheckboxModule,
    MatExpansionModule, MatTooltipModule, MatDialogModule,
    TranslatePipe,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  displayedColumns = ['name', 'description', 'users', 'permissions', 'status', 'actions'];
  roles: RoleDto[] = [];
  permissionGroups: PermissionGroupDto[] = [];
  selectedRole: RoleDto | null = null;

  ngOnInit(): void {
    this.loadRoles();
    this.permissionService.getGrouped().subscribe({
      next: (groups) => (this.permissionGroups = groups),
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        if (this.selectedRole) {
          this.selectedRole = this.roles.find(r => r.id === this.selectedRole!.id) ?? null;
        }
      },
    });
  }

  selectRole(role: RoleDto): void {
    this.selectedRole = role;
  }

  isPermissionAssigned(permCode: string): boolean {
    return this.selectedRole?.permissions?.includes(permCode) ?? false;
  }

  togglePermission(permCode: string): void {
    if (!this.selectedRole) return;
    const perms = [...(this.selectedRole.permissions ?? [])];
    const idx = perms.indexOf(permCode);
    if (idx >= 0) perms.splice(idx, 1);
    else perms.push(permCode);
    this.selectedRole = { ...this.selectedRole, permissions: perms };
  }

  savePermissions(): void {
    if (!this.selectedRole) return;
    this.roleService.assignPermissions(this.selectedRole.id, this.selectedRole.permissions).subscribe({
      next: () => {
        this.toast('ROLES.TOAST.SAVED');
        this.loadRoles();
      },
    });
  }

  openCreate(): void {
    this.dialog.open(RoleDialogComponent, { width: '480px', data: {} }).afterClosed()
      .subscribe(result => {
        if (result) {
          this.toast('ROLES.TOAST.CREATED');
          this.loadRoles();
        }
      });
  }

  openEdit(role: RoleDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(RoleDialogComponent, { width: '480px', data: { role } }).afterClosed()
      .subscribe(result => {
        if (result) {
          this.toast('ROLES.TOAST.UPDATED');
          this.loadRoles();
        }
      });
  }

  confirmDelete(role: RoleDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title:        this.translate.instant('ROLES.CONFIRM_DELETE.TITLE'),
        message:      this.translate.instant('ROLES.CONFIRM_DELETE.MESSAGE', { name: role.name }),
        confirmLabel: this.translate.instant('COMMON.DELETE'),
        danger: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            if (this.selectedRole?.id === role.id) this.selectedRole = null;
            this.toast('ROLES.TOAST.DELETED');
            this.loadRoles();
          },
        });
      }
    });
  }

  private toast(key: string): void {
    this.snackBar.open(
      this.translate.instant(key),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 2500 }
    );
  }
}
